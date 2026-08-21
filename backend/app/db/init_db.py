from sqlalchemy.orm import Session
from app.db.session import engine, Base
from app.models.sport import Sport, AssessmentType
from app.models.user import Profile, AthleteProfile
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.scout import ScoutNote
from app.models.achievement import Achievement
from app.models.community import Post, PostComment, PostReaction
from app.models.connection import UserConnection
from app.models.message import Conversation, ConversationMember, Message
from app.models.block import UserBlock
from app.models.report import Report
from app.models.notification import Notification

SPORTS_CATALOG = [
    {
        "id": "football",
        "name": "Football (Soccer)",
        "icon": "Activity",
        "category": "Team Field Sport",
        "active_athletes_count": 0,
        "drills": [
            {
                "id": "football_sprint_20m",
                "name": "20m Linear Sprint & Deceleration",
                "description": "Evaluates acceleration burst, peak velocity, and braking balance.",
                "duration_sec": 12,
                "camera_angle": "Side profile (orthogonal 90 degrees), 5m away",
                "metrics_measured": ["0-10m Split (s)", "Peak Speed (km/h)", "Stride Frequency (Hz)", "Deceleration G-Force"],
                "instructions": ["Set two cones 20m apart with clear line markings", "Start in a low athletic stance behind Cone A", "Sprint at 100% maximum effort past Cone B", "Come to a controlled stop inside the deceleration box"],
                "requirements": ["Standard 20m running strip", "2 landmark marker cones", "Contrast athletic clothing"]
            },
            {
                "id": "football_cone_weave",
                "name": "5-Cone Agility Slalom",
                "description": "Measures lateral cutting velocity, center of mass shift, and hip mobility.",
                "duration_sec": 15,
                "camera_angle": "Front elevated angle (45 degrees), 6m away",
                "metrics_measured": ["Total Course Time (s)", "Change of Direction Speed (m/s)", "Hip Dip Angle (deg)", "Contact Ground Time (ms)"],
                "instructions": ["Place 5 cones in a straight line spaced 2m apart", "Start behind Cone 1 on the audio cue", "Weave through all cones in slalom path", "Sprint directly back across the start line"],
                "requirements": ["5 cones spaced at 2m intervals", "Flat non-slip turf or grass surface"]
            }
        ]
    },
    {
        "id": "basketball",
        "name": "Basketball",
        "icon": "Award",
        "category": "Court Sport",
        "active_athletes_count": 0,
        "drills": [
            {
                "id": "basketball_vertical_jump",
                "name": "Standing Countermovement Vertical Jump",
                "description": "Assesses explosive lower-body power, reactive strength index, and landing mechanics.",
                "duration_sec": 10,
                "camera_angle": "Front facing (chest level), 4m distance",
                "metrics_measured": ["Vertical Jump Height (cm)", "Takeoff Velocity (m/s)", "Flight Time (s)", "Knee Valgus on Landing (deg)"],
                "instructions": ["Stand upright with feet shoulder-width apart", "Perform a rapid countermovement dip with arm swing", "Explode vertically for maximum height", "Land on both feet and hold landing for 2 seconds"],
                "requirements": ["Flat court surface with overhead clearance", "Calibrated height marker or wall line"]
            },
            {
                "id": "basketball_lane_agility",
                "name": "Lane Agility Drill",
                "description": "Standardized NBA draft combine test evaluating lateral slide, backpedal, and sprint.",
                "duration_sec": 20,
                "camera_angle": "Corner high angle (30 degrees), 8m away",
                "metrics_measured": ["Total Lane Time (s)", "Lateral Slide Velocity (m/s)", "Backpedal Cadence", "Turn Transition Time (ms)"],
                "instructions": ["Start at bottom-right corner of the key", "Sprint to top-right corner, defensive slide across free throw line", "Backpedal down left lane line, slide back to start", "Reverse sequence direction immediately"],
                "requirements": ["Regulation basketball key (16ft x 19ft)", "Court footwear"]
            }
        ]
    },
    {
        "id": "athletics",
        "name": "Track & Athletics",
        "icon": "Zap",
        "category": "Individual Speed & Field",
        "active_athletes_count": 0,
        "drills": [
            {
                "id": "athletics_block_start",
                "name": "Block Start & Drive Phase (0-15m)",
                "description": "Evaluates block clearance velocity, torso drive angle, and first 6 strides power.",
                "duration_sec": 8,
                "camera_angle": "Direct side view (track level), 6m perpendicular distance",
                "metrics_measured": ["Block Clearance Time (s)", "Initial Torso Angle (deg)", "First 3 Strides Length (m)", "Horizontal Impulse"],
                "instructions": ["Set blocks according to personal stance", "Hold standard set position on ready call", "Drive out with full triple extension", "Maintain forward lean through 15 meters"],
                "requirements": ["Running track surface", "Starting blocks (or marked line)", "High-contrast sprint attire"]
            }
        ]
    },
    {
        "id": "fitness",
        "name": "Fitness Assessment (SIH Core)",
        "icon": "HeartPulse",
        "category": "Fitness Testing",
        "active_athletes_count": 0,
        "drills": [
            {
                "id": "vertical_jump",
                "name": "Vertical Jump",
                "description": "Standing countermovement vertical jump - measures lower-body explosive power.",
                "duration_sec": 10,
                "camera_angle": "Front facing (chest level), 4m distance",
                "metrics_measured": ["Normalized Vertical Displacement", "Flight Time (ms)", "Takeoff Timestamp (ms)", "Peak Timestamp (ms)", "Landing Timestamp (ms)", "Knee Angle at Loading (deg)", "Body Alignment Score"],
                "instructions": [
                    "Stand upright with feet shoulder-width apart, facing the camera",
                    "Ensure your full body is visible in the frame (head to feet)",
                    "Camera should be stationary at chest level, ~4 meters away",
                    "Ensure adequate lighting - avoid shadows on your body",
                    "Perform a rapid countermovement dip with arm swing",
                    "Explode vertically for maximum height",
                    "Land on both feet and hold the landing for 2 seconds",
                    "Only one athlete should be visible in the frame"
                ],
                "requirements": [
                    "Flat court surface with overhead clearance",
                    "Calibrated height marker or wall line (for calibration)",
                    "Contrast athletic clothing",
                    "Camera at chest level, 4 meters distance"
                ]
            },
            {
                "id": "height",
                "name": "Height Measurement",
                "description": "Standing height measurement using video analysis with calibration reference.",
                "duration_sec": 5,
                "camera_angle": "Front facing, full body with calibration marker",
                "metrics_measured": ["Height (cm) - requires calibration"],
                "instructions": [
                    "Stand upright against a wall with a known height marker",
                    "Camera should capture full body including the marker",
                    "Remain still for 3 seconds"
                ],
                "requirements": [
                    "Wall with known height calibration markers",
                    "Camera positioned to capture full height"
                ]
            },
            {
                "id": "weight",
                "name": "Weight Measurement",
                "description": "Body weight measurement - manual entry with digital scale.",
                "duration_sec": 0,
                "camera_angle": "N/A",
                "metrics_measured": ["Weight (kg)"],
                "instructions": [
                    "Step on calibrated digital scale",
                    "Record weight to nearest 0.1 kg",
                    "Enter manually in the app"
                ],
                "requirements": [
                    "Calibrated digital weighing scale"
                ]
            },
            {
                "id": "shuttle_run",
                "name": "Shuttle Run",
                "description": "10m shuttle run - measures agility and change of direction speed.",
                "duration_sec": 20,
                "camera_angle": "Side view covering full shuttle distance",
                "metrics_measured": ["Total Time (s)", "Split Times", "Change of Direction Count"],
                "instructions": [
                    "Set up cones 10 meters apart",
                    "Start behind first cone",
                    "Sprint to second cone, touch, return",
                    "Repeat for required number of shuttles"
                ],
                "requirements": [
                    "Two cones 10 meters apart",
                    "Flat non-slip surface",
                    "Camera covering full shuttle distance"
                ]
            },
            {
                "id": "sit_up",
                "name": "Sit-ups",
                "description": "Maximum sit-ups in 60 seconds - measures core muscular endurance.",
                "duration_sec": 60,
                "camera_angle": "Side angle, 2 meters away",
                "metrics_measured": ["Repetition Count", "Tempo", "Form Score"],
                "instructions": [
                    "Lie on back with knees bent, feet flat",
                    "Hands across chest or behind head",
                    "Perform as many sit-ups as possible in 60 seconds",
                    "Full range: shoulders touch floor, elbows touch knees"
                ],
                "requirements": [
                    "Exercise mat",
                    "Camera at side angle, 2 meters away",
                    "Timer visible or audio cue"
                ]
            },
            {
                "id": "endurance_run",
                "name": "Endurance Run",
                "description": "Distance run - measures aerobic capacity and endurance.",
                "duration_sec": 300,
                "camera_angle": "Tracking camera or GPS fallback",
                "metrics_measured": ["Distance (m)", "Pace", "Heart Rate Estimate"],
                "instructions": [
                    "Run at steady pace for prescribed distance/time",
                    "Camera should track movement (or use GPS fallback)",
                    "Maintain consistent form"
                ],
                "requirements": [
                    "Measured running track or course",
                    "Camera positioned for tracking"
                ]
            }
        ]
    },
    {
        "id": "elitez_extended",
        "name": "Elitez Extended Tests",
        "icon": "Target",
        "category": "Extended Assessment",
        "active_athletes_count": 0,
        "drills": [
            {
                "id": "squat",
                "name": "Squat Analysis",
                "description": "Barbell or bodyweight squat - measures depth, symmetry, and tempo.",
                "duration_sec": 15,
                "camera_angle": "Side angle, 3 meters away",
                "metrics_measured": ["Depth (cm)", "Knee Angle Min (deg)", "Tempo", "Symmetry Score", "Bar Path Deviation"],
                "instructions": [
                    "Stand with feet shoulder-width apart",
                    "Squat to parallel or below",
                    "Keep chest up, knees tracking over toes",
                    "Return to standing"
                ],
                "requirements": [
                    "Camera at side angle, 3 meters away",
                    "Contrast clothing for joint visibility"
                ]
            },
            {
                "id": "push_up",
                "name": "Push-up Analysis",
                "description": "Push-up - measures repetition count, depth consistency, and body alignment.",
                "duration_sec": 60,
                "camera_angle": "Side angle, 2 meters away",
                "metrics_measured": ["Repetition Count", "Depth Consistency", "Tempo", "Body Alignment"],
                "instructions": [
                    "Start in plank position, hands under shoulders",
                    "Lower chest to floor, push back up",
                    "Maintain straight body line",
                    "Complete as many reps as possible"
                ],
                "requirements": [
                    "Camera at side angle, 2 meters away",
                    "Exercise mat"
                ]
            },
            {
                "id": "jump_variations",
                "name": "Jump Variations",
                "description": "Various jump tests - box jump, broad jump, drop jump.",
                "duration_sec": 15,
                "camera_angle": "Camera covering full movement",
                "metrics_measured": ["Jump Height (cm)", "Contact Time (ms)", "RSI"],
                "instructions": [
                    "Perform prescribed jump variation (box jump, broad jump, etc.)",
                    "Land with control",
                    "Reset between attempts"
                ],
                "requirements": [
                    "Appropriate equipment for variation",
                    "Camera covering full movement"
                ]
            },
            {
                "id": "sprint",
                "name": "Sprint Analysis",
                "description": "Linear sprint - measures split times, max velocity, stride parameters.",
                "duration_sec": 10,
                "camera_angle": "Side angle covering full distance",
                "metrics_measured": ["Split Time", "Max Velocity", "Stride Length", "Stride Frequency"],
                "instructions": [
                    "Start in blocks or standing start",
                    "Sprint at maximum effort through finish",
                    "Maintain form through finish line"
                ],
                "requirements": [
                    "Measured sprint distance (10m, 20m, 40m)",
                    "Camera at side angle covering full distance",
                    "Starting blocks optional"
                ]
            }
        ]
    }
]

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db: Session = next(get_db_session())
    try:
        # Check if sports catalog exists
        existing_sports = db.query(Sport).count()
        if existing_sports == 0:
            for s_data in SPORTS_CATALOG:
                sport_obj = Sport(
                    id=s_data["id"],
                    name=s_data["name"],
                    icon=s_data["icon"],
                    description=s_data["category"],
                    category=s_data["category"],
                    active_athletes_count=0
                )
                db.add(sport_obj)
                
                for d_data in s_data["drills"]:
                    drill_obj = AssessmentType(
                        id=d_data["id"],
                        sport_id=s_data["id"],
                        name=d_data["name"],
                        description=d_data["description"],
                        duration_sec=d_data["duration_sec"],
                        camera_angle=d_data["camera_angle"],
                        metrics_measured=d_data["metrics_measured"],
                        instructions=d_data["instructions"],
                        requirements=d_data["requirements"]
                    )
                    db.add(drill_obj)
            db.commit()
            print("Database initialized with static sports taxonomy.")
    finally:
        db.close()

def get_db_session():
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
