import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import Profile, AthleteProfile
from app.models.community import Post, PostComment, PostReaction
from app.models.block import UserBlock
from app.models.notification import Notification
from app.schemas.community import PostCreate, PostUpdate, PostOut, CommentCreate, CommentOut, ReactionToggleRequest

router = APIRouter()

@router.post("/posts", response_model=PostOut)
async def create_post(
    data: PostCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    author_name = profile.name if profile else current_user.get("name", "Athlete")
    author_avatar = profile.avatar_url if profile else None
    author_role = profile.role if profile else current_user.get("role", "athlete")

    post_id = f"post_{uuid.uuid4().hex[:12]}"
    new_post = Post(
        id=post_id,
        author_id=user_id,
        author_name=author_name,
        author_avatar=author_avatar,
        author_role=author_role,
        content=data.content,
        media_url=data.media_url,
        media_type=data.media_type,
        sport=data.sport,
        likes_count=0,
        comments_count=0
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    out = PostOut.model_validate(new_post)
    out.is_liked_by_me = False
    return out

@router.get("/posts", response_model=List[PostOut])
async def list_posts(
    author_id: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")

    # Exclude blocked users' posts
    blocked_subquery = db.query(UserBlock.blocked_id).filter(UserBlock.blocker_id == user_id)
    blocker_subquery = db.query(UserBlock.blocker_id).filter(UserBlock.blocked_id == user_id)

    query = db.query(Post).filter(
        ~Post.author_id.in_(blocked_subquery),
        ~Post.author_id.in_(blocker_subquery)
    )

    if author_id:
        query = query.filter(Post.author_id == author_id)
    if sport and sport != "all":
        query = query.filter(Post.sport.ilike(f"%{sport}%"))

    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    
    # Get liked posts by current user for UI indicator
    post_ids = [p.id for p in posts]
    user_likes = set(
        r.post_id for r in db.query(PostReaction.post_id).filter(
            PostReaction.user_id == user_id,
            PostReaction.post_id.in_(post_ids)
        ).all()
    )

    result = []
    for p in posts:
        item = PostOut.model_validate(p)
        item.is_liked_by_me = p.id in user_likes
        result.append(item)
    return result

@router.get("/posts/{post_id}", response_model=PostOut)
async def get_post_by_id(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    is_blocked = db.query(UserBlock).filter(
        ((UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == post.author_id)) |
        ((UserBlock.blocker_id == post.author_id) & (UserBlock.blocked_id == user_id))
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Content unavailable")

    has_liked = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == user_id
    ).first() is not None

    out = PostOut.model_validate(post)
    out.is_liked_by_me = has_liked
    return out

@router.put("/posts/{post_id}", response_model=PostOut)
async def update_post(
    post_id: str,
    data: PostUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own posts")

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(post, field, val)

    db.commit()
    db.refresh(post)

    out = PostOut.model_validate(post)
    has_liked = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == user_id
    ).first() is not None
    out.is_liked_by_me = has_liked
    return out

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != user_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own posts")

    db.delete(post)
    db.commit()
    return {"status": "success", "message": "Post deleted successfully"}

# Reactions & Likes
@router.post("/posts/{post_id}/react")
async def toggle_post_reaction(
    post_id: str,
    req: ReactionToggleRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check blocking
    is_blocked = db.query(UserBlock).filter(
        ((UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == post.author_id)) |
        ((UserBlock.blocker_id == post.author_id) & (UserBlock.blocked_id == user_id))
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Cannot react to this post")

    existing_rxn = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == user_id
    ).first()

    if existing_rxn:
        # Remove reaction (unlike)
        db.delete(existing_rxn)
        post.likes_count = max(0, (post.likes_count or 1) - 1)
        is_liked = False
    else:
        # Add reaction
        new_rxn = PostReaction(
            id=f"rxn_{uuid.uuid4().hex[:12]}",
            post_id=post_id,
            user_id=user_id,
            reaction_type=req.reaction_type
        )
        db.add(new_rxn)
        post.likes_count = (post.likes_count or 0) + 1
        is_liked = True

        # Send notification to post author if not self
        if post.author_id != user_id:
            profile = db.query(Profile).filter(Profile.id == user_id).first()
            sender_name = profile.name if profile else "An athlete"
            notif = Notification(
                id=f"notif_{uuid.uuid4().hex[:12]}",
                recipient_id=post.author_id,
                sender_id=user_id,
                sender_name=sender_name,
                type="new_reaction",
                title="New reaction on your post",
                body=f"{sender_name} liked your post.",
                target_id=post_id
            )
            db.add(notif)

    db.commit()
    db.refresh(post)
    return {
        "status": "success",
        "is_liked": is_liked,
        "likes_count": post.likes_count
    }

# Comments
@router.post("/posts/{post_id}/comments", response_model=CommentOut)
async def add_comment(
    post_id: str,
    data: CommentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    is_blocked = db.query(UserBlock).filter(
        ((UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == post.author_id)) |
        ((UserBlock.blocker_id == post.author_id) & (UserBlock.blocked_id == user_id))
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Cannot comment on this post")

    profile = db.query(Profile).filter(Profile.id == user_id).first()
    author_name = profile.name if profile else current_user.get("name", "Athlete")
    author_avatar = profile.avatar_url if profile else None

    cmt_id = f"cmt_{uuid.uuid4().hex[:12]}"
    comment = PostComment(
        id=cmt_id,
        post_id=post_id,
        author_id=user_id,
        author_name=author_name,
        author_avatar=author_avatar,
        content=data.content
    )
    db.add(comment)
    post.comments_count = (post.comments_count or 0) + 1

    # Notify author if not self
    if post.author_id != user_id:
        notif = Notification(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            recipient_id=post.author_id,
            sender_id=user_id,
            sender_name=author_name,
            type="new_comment",
            title="New comment on your post",
            body=f"{author_name} commented: {data.content[:60]}...",
            target_id=post_id
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)
    return comment

@router.get("/posts/{post_id}/comments", response_model=List[CommentOut])
async def list_comments(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Exclude comments from blocked users
    blocked_subquery = db.query(UserBlock.blocked_id).filter(UserBlock.blocker_id == user_id)
    blocker_subquery = db.query(UserBlock.blocker_id).filter(UserBlock.blocked_id == user_id)

    comments = db.query(PostComment).filter(
        PostComment.post_id == post_id,
        ~PostComment.author_id.in_(blocked_subquery),
        ~PostComment.author_id.in_(blocker_subquery)
    ).order_by(PostComment.created_at.asc()).all()

    return comments

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    comment = db.query(PostComment).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != user_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if post:
        post.comments_count = max(0, (post.comments_count or 1) - 1)

    db.delete(comment)
    db.commit()
    return {"status": "success", "message": "Comment deleted successfully"}
