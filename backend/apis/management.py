

import os
from datetime import datetime
from typing import Optional, List
import math

from common.utils import hash_password, get_length_to_show # Assuming this is your actual hash_password utility
from fastapi import APIRouter, Body, Query, HTTPException
from models import (Action, Doctors, Patients, SessionDep, Stage, StepsInfo,
                    VideoPath)
from pydantic import BaseModel

# For moved dashboard routes
from pyecharts import options as opts
from pyecharts.charts import Line
from pyecharts.globals import ThemeType
from sqlalchemy import func


router = APIRouter(tags=["management"], prefix="/management")

# --- Base Pydantic Models ---
class BASE(BaseModel):
    admin_doctor_id: int

# --- Doctor Management Models ---
class CreateDoctorManagement(BASE):
    username: str
    password: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    role_id: Optional[int] = None
    notes: Optional[str] = None

class UpdateDoctor(BASE):
    doctor_id: int
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    department: Optional[str] = None
    role_id: Optional[int] = None
    notes: Optional[str] = None

class DeleteDoctor(BASE):
    doctor_id: int
    assign_doctor_id: int

# --- Patient Management Models ---
class CreatePatientManagement(BASE):
    username: str
    age: Optional[int] = None
    gender: Optional[str] = None
    case_id: str
    doctor_id: Optional[int] = None
    notes: Optional[str] = None

class UpdatePatient(BASE):
    patient_id: int
    username: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    case_id: Optional[str] = None
    doctor_id: Optional[int] = None
    notes: Optional[str] = None

class DeletePatient(BASE):
    patient_id: int
    force: bool = False # Added force delete flag

# --- Other Models ---
class Login(BaseModel):
    username: str
    password: str

class DeleteVideo(BASE):
    video_id: int
    force: bool = False

class DeleteAction(BASE):
    action_id: int

# --- Dashboard Models ---
class DashboardMetrics(BaseModel):
    doctorCount: int
    patientCount: int
    videoCount: int
    dataAnalysisCount: int

class DataAnalysisDataPoint(BaseModel):
    date: str
    analyses: int


# --- Helper for Authorization ---
def authorize_admin(admin_doctor_id: int, session: SessionDep):
    admin_doctor = session.query(Doctors).filter(
        Doctors.id == admin_doctor_id, Doctors.is_deleted == False).first()
    if not admin_doctor:
        raise HTTPException(status_code=404, detail="Admin doctor not found")
    if admin_doctor.role_id != 1:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource")
    return admin_doctor

# --- API Endpoints ---

@router.post("/login")
def login(login_data: Login, session: SessionDep = SessionDep):
    doctor = session.query(Doctors).filter(
        Doctors.username == login_data.username, Doctors.is_deleted == False).first()

    # Use your actual password checking function
    from common.utils import check_password # Ensure this import is correct
    if not doctor or not check_password(login_data.password, doctor.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if doctor.role_id != 1:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource")

    doctor_info = doctor.to_dict()
    if 'password' in doctor_info:
        del doctor_info['password']

    return {"message": "Login successful", "doctor": doctor_info}

@router.get("/doctors")
def get_doctors(admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    doctors_db = session.query(Doctors).filter(Doctors.is_deleted == False).all()
    if not doctors_db:
        return []

    result = []
    for doctor in doctors_db:
        patient_count = session.query(Patients).filter(Patients.doctor_id == doctor.id, Patients.is_deleted == False).count()
        doc_dict = doctor.to_dict()
        doc_dict["patientCount"] = patient_count
        if 'password' in doc_dict:
            del doc_dict['password']
        result.append(doc_dict)
    return result

@router.post("/doctor")
async def create_doctor_management(doctor_data: CreateDoctorManagement, session: SessionDep = SessionDep):
    authorize_admin(doctor_data.admin_doctor_id, session)

    existing_doctor_username = session.query(Doctors).filter(Doctors.username == doctor_data.username, Doctors.is_deleted == False).first()
    if existing_doctor_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing_doctor_email = session.query(Doctors).filter(Doctors.email == doctor_data.email, Doctors.is_deleted == False).first()
    if existing_doctor_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_doctor = Doctors(
        username=doctor_data.username,
        password=hash_password(doctor_data.password),
        email=doctor_data.email,
        phone=doctor_data.phone,
        department=doctor_data.department,
        role_id=doctor_data.role_id if doctor_data.role_id is not None else 2, # Default to Doctor role
        notes=doctor_data.notes,
        create_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        update_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        is_deleted=False
    )
    session.add(new_doctor)
    session.commit()
    session.refresh(new_doctor)

    doc_dict = new_doctor.to_dict()
    if 'password' in doc_dict:
            del doc_dict['password']
    doc_dict["patientCount"] = 0
    return doc_dict

@router.put("/doctor")
def update_doctor(doctor_update_data: UpdateDoctor, session: SessionDep = SessionDep):
    authorize_admin(doctor_update_data.admin_doctor_id, session)

    doctor_db = session.query(Doctors).filter(
        Doctors.id == doctor_update_data.doctor_id, Doctors.is_deleted == False).first()
    if not doctor_db:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if doctor_update_data.username and doctor_update_data.username != doctor_db.username:
        existing_doctor_username = session.query(Doctors).filter(Doctors.username == doctor_update_data.username, Doctors.id != doctor_db.id, Doctors.is_deleted == False).first()
        if existing_doctor_username:
            raise HTTPException(status_code=400, detail="Username already taken by another doctor.")
        doctor_db.username = doctor_update_data.username

    if doctor_update_data.email and doctor_update_data.email != doctor_db.email:
        existing_doctor_email = session.query(Doctors).filter(Doctors.email == doctor_update_data.email, Doctors.id != doctor_db.id, Doctors.is_deleted == False).first()
        if existing_doctor_email:
            raise HTTPException(status_code=400, detail="Email already taken by another doctor.")
        doctor_db.email = doctor_update_data.email

    if doctor_update_data.phone is not None:
        doctor_db.phone = doctor_update_data.phone
    if doctor_update_data.password: # Only update password if provided and not empty
        doctor_db.password = hash_password(doctor_update_data.password)
    if doctor_update_data.department is not None:
        doctor_db.department = doctor_update_data.department
    if doctor_update_data.role_id is not None:
        doctor_db.role_id = doctor_update_data.role_id
    if doctor_update_data.notes is not None:
        doctor_db.notes = doctor_update_data.notes

    doctor_db.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    session.commit()
    session.refresh(doctor_db)

    doc_dict = doctor_db.to_dict()
    if 'password' in doc_dict:
            del doc_dict['password']
    doc_dict["patientCount"] = session.query(Patients).filter(Patients.doctor_id == doctor_db.id, Patients.is_deleted == False).count()
    return doc_dict

@router.delete("/doctor")
def delete_doctor(doctor_delete_data: DeleteDoctor, session: SessionDep = SessionDep):
    authorize_admin(doctor_delete_data.admin_doctor_id, session)

    doctor_db = session.query(Doctors).filter(
        Doctors.id == doctor_delete_data.doctor_id, Doctors.is_deleted == False).first()
    if not doctor_db:
        raise HTTPException(status_code=404, detail="Doctor not found")

    assigned_patients_count = session.query(Patients).filter(
        Patients.doctor_id == doctor_delete_data.doctor_id, Patients.is_deleted == False).count()

    if assigned_patients_count > 0:
        assign_doctor = session.query(Doctors).filter(
            Doctors.id == doctor_delete_data.assign_doctor_id, Doctors.is_deleted == False).first()
        if not assign_doctor:
            raise HTTPException(status_code=400, detail="Assigned doctor for patient reassignment not found or is deleted.")
        if assign_doctor.id == doctor_db.id:
            raise HTTPException(status_code=400, detail="Cannot reassign patients to the doctor being deleted.")

        patients_to_reassign = session.query(Patients).filter(
            Patients.doctor_id == doctor_delete_data.doctor_id, Patients.is_deleted == False).all()
        for patient in patients_to_reassign:
            patient.doctor_id = doctor_delete_data.assign_doctor_id
            patient.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    doctor_db.is_deleted = True
    doctor_db.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    session.commit()
    return {"message": "Doctor deleted successfully"}


@router.get("/patients")
def get_patients(admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    patients_db = session.query(Patients).filter(Patients.is_deleted == False).all()
    if not patients_db:
        return []

    result = []
    for patient in patients_db:
        pat_dict = patient.to_dict()
        doctor_username = "N/A"
        if patient.doctor_id:
            doctor = session.query(Doctors.username).filter(Doctors.id == patient.doctor_id, Doctors.is_deleted == False).scalar()
            if doctor:
                doctor_username = doctor
        pat_dict["attendingDoctorName"] = doctor_username

        pat_dict["videoCount"] = session.query(VideoPath).filter(VideoPath.patient_id == patient.id, VideoPath.is_deleted == False).count()
        pat_dict["analysisCount"] = session.query(Action).filter(Action.patient_id == patient.id, Action.is_deleted == False).count()
        result.append(pat_dict)
    return result

@router.post("/patient")
async def create_patient_management(patient_data: CreatePatientManagement, session: SessionDep = SessionDep):
    authorize_admin(patient_data.admin_doctor_id, session)

    existing_patient = session.query(Patients).filter(Patients.case_id == patient_data.case_id, Patients.is_deleted == False).first()
    if existing_patient:
        raise HTTPException(status_code=400, detail="Case ID already exists")

    assigned_doctor_username = "N/A"
    if patient_data.doctor_id:
        assigned_doctor = session.query(Doctors).filter(Doctors.id == patient_data.doctor_id, Doctors.is_deleted == False).first()
        if not assigned_doctor:
            raise HTTPException(status_code=404, detail="Assigned doctor not found")
        assigned_doctor_username = assigned_doctor.username


    new_patient = Patients(
        username=patient_data.username,
        age=patient_data.age,
        gender=patient_data.gender,
        case_id=patient_data.case_id,
        doctor_id=patient_data.doctor_id,
        notes=patient_data.notes,
        create_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        update_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        is_deleted=False
    )
    session.add(new_patient)
    session.commit()
    session.refresh(new_patient)

    pat_dict = new_patient.to_dict()
    pat_dict["attendingDoctorName"] = assigned_doctor_username
    pat_dict["videoCount"] = 0
    pat_dict["analysisCount"] = 0
    return pat_dict


@router.put("/patient")
def update_patient(patient_update_data: UpdatePatient, session: SessionDep = SessionDep):
    authorize_admin(patient_update_data.admin_doctor_id, session)

    patient_db = session.query(Patients).filter(
        Patients.id == patient_update_data.patient_id, Patients.is_deleted == False).first()
    if not patient_db:
        raise HTTPException(status_code=404, detail="Patient not found")

    if patient_update_data.username:
        patient_db.username = patient_update_data.username
    if patient_update_data.age is not None:
        patient_db.age = patient_update_data.age
    if patient_update_data.gender is not None:
        patient_db.gender = patient_update_data.gender

    if patient_update_data.case_id and patient_update_data.case_id != patient_db.case_id:
        existing_patient_case_id = session.query(Patients).filter(Patients.case_id == patient_update_data.case_id, Patients.id != patient_db.id, Patients.is_deleted == False).first()
        if existing_patient_case_id:
            raise HTTPException(status_code=400, detail="Case ID already taken by another patient.")
        patient_db.case_id = patient_update_data.case_id

    # Handle doctor_id update, including setting to None
    # Check if 'doctor_id' was explicitly provided in the payload
    if 'doctor_id' in patient_update_data.model_fields_set:
        if patient_update_data.doctor_id is None: # Explicitly set to null
            patient_db.doctor_id = None
        else: # A doctor ID was provided
            new_assigned_doctor = session.query(Doctors).filter(Doctors.id == patient_update_data.doctor_id, Doctors.is_deleted == False).first()
            if not new_assigned_doctor:
                raise HTTPException(status_code=404, detail="New assigned doctor not found")
            patient_db.doctor_id = patient_update_data.doctor_id
    # If 'doctor_id' is not in model_fields_set, it means it wasn't in the payload, so we don't update it.


    if patient_update_data.notes is not None:
        patient_db.notes = patient_update_data.notes

    patient_db.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    session.commit()
    session.refresh(patient_db)

    pat_dict = patient_db.to_dict()
    current_doctor_username = "N/A"
    if patient_db.doctor_id:
        current_doctor = session.query(Doctors.username).filter(Doctors.id == patient_db.doctor_id, Doctors.is_deleted == False).scalar()
        if current_doctor:
            current_doctor_username = current_doctor
    pat_dict["attendingDoctorName"] = current_doctor_username
    pat_dict["videoCount"] = session.query(VideoPath).filter(VideoPath.patient_id == patient_db.id, VideoPath.is_deleted == False).count()
    pat_dict["analysisCount"] = session.query(Action).filter(Action.patient_id == patient_db.id, Action.is_deleted == False).count()
    return pat_dict


@router.delete("/patient")
def delete_patient(patient_delete_data: DeletePatient, session: SessionDep = SessionDep):
    authorize_admin(patient_delete_data.admin_doctor_id, session)

    patient_db = session.query(Patients).filter(
        Patients.id == patient_delete_data.patient_id, Patients.is_deleted == False).first()
    if not patient_db:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient_delete_data.force:
        patient_db.is_deleted = True
        patient_db.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        videos = session.query(VideoPath).filter(
            VideoPath.patient_id == patient_delete_data.patient_id, VideoPath.is_deleted == False).all()
        for video in videos:
            video.is_deleted = True
            video.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        actions = session.query(Action).filter(
            Action.patient_id == patient_delete_data.patient_id, Action.is_deleted == False).all()
        for action in actions:
            action.is_deleted = True
            action.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            stages = session.query(Stage).filter(
                Stage.action_id == action.id, Stage.is_deleted == False).all()
            for stage in stages:
                stage.is_deleted = True
                stage.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    else:
        # Hard delete: physical removal from database
        actions_to_delete = session.query(Action).filter(Action.patient_id == patient_db.id).all()
        for action in actions_to_delete:
            stages_to_delete = session.query(Stage).filter(Stage.action_id == action.id).all()
            for stage in stages_to_delete:
                session.query(StepsInfo).filter(StepsInfo.stage_id == stage.id).delete()
                session.delete(stage)
            session.delete(action)

        videos_to_delete = session.query(VideoPath).filter(VideoPath.patient_id == patient_db.id).all()
        for video in videos_to_delete:
            # if os.path.exists(video.video_path): os.remove(video.video_path) # File system removal commented out
            session.delete(video)

        session.delete(patient_db)

    session.commit()
    return {"message": "Patient deleted successfully"}


@router.get("/doctor")
def get_doctor_by_id(doctor_id: int = Query(...),
                     admin_doctor_id: int = Query(...),
                     session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    doctor = session.query(Doctors).filter(
        Doctors.id == doctor_id, Doctors.is_deleted == False).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    patients = session.query(Patients).filter(
        Patients.doctor_id == doctor_id, Patients.is_deleted == False).all()

    doc_dict = doctor.to_dict()
    if 'password' in doc_dict:
        del doc_dict['password']
    doc_dict["patientCount"] = len(patients)

    return {
        "doctor": doc_dict,
        "patients": [patient.to_dict() for patient in patients]
    }


@router.get("/patient")
def get_patient_by_id(patient_id: int = Query(...),
                      admin_doctor_id: int = Query(...),
                      session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    patient = session.query(Patients).filter(
        Patients.id == patient_id, Patients.is_deleted == False).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    pat_dict = patient.to_dict()
    doctor_name = "N/A"
    if patient.doctor_id:
        doc_username = session.query(Doctors.username).filter(Doctors.id == patient.doctor_id).scalar()
        if doc_username:
             doctor_name = doc_username
    pat_dict["attendingDoctorName"] = doctor_name
    pat_dict["videoCount"] = session.query(VideoPath).filter(VideoPath.patient_id == patient.id, VideoPath.is_deleted == False).count()
    pat_dict["analysisCount"] = session.query(Action).filter(Action.patient_id == patient.id, Action.is_deleted == False).count()

    videos = session.query(VideoPath).filter(
        VideoPath.patient_id == patient_id, VideoPath.is_deleted == False).all()
    actions = session.query(Action).filter(
        Action.patient_id == patient_id, Action.is_deleted == False).all()

    return {
        "patient": pat_dict,
        "videos": [video.to_dict() for video in videos],
        "actions": [action.to_dict() for action in actions]
    }


@router.get("/actions")
def get_actions(admin_doctor_id: int = Query(...),
                session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    actions = session.query(Action).filter(
        Action.is_deleted == False).all()
    if not actions:
        return []
    return [action.to_dict() for action in actions]


@router.get("/videos")
def get_videos(admin_doctor_id: int = Query(...),
               session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    videos = session.query(VideoPath).filter(
        VideoPath.is_deleted == False).all()
    if not videos:
        return []
    return [video.to_dict() for video in videos]


@router.delete("/video")
def delete_video(video_del_data: DeleteVideo, session: SessionDep = SessionDep):
    authorize_admin(video_del_data.admin_doctor_id, session)
    video_db = session.query(VideoPath).filter(
        VideoPath.id == video_del_data.video_id, VideoPath.is_deleted == False).first()
    if not video_db:
        raise HTTPException(status_code=404, detail="Video not found")

    if not video_del_data.force:
        video_db.is_deleted = True
        video_db.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        actions = session.query(Action).filter(Action.video_id == video_db.id, Action.is_deleted == False).all()
        for action in actions:
            action.is_deleted = True
            action.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            # Soft delete stages and steps
            stages = session.query(Stage).filter(Stage.action_id == action.id, Stage.is_deleted == False).all()
            for stage in stages:
                stage.is_deleted = True
                stage.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                steps = session.query(StepsInfo).filter(StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
                for step in steps:
                    step.is_deleted = True
                    step.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    else:
        actions = session.query(Action).filter(Action.video_id == video_del_data.video_id).all()
        for action in actions:
            stages = session.query(Stage).filter(Stage.action_id == action.id).all()
            for stage in stages:
                session.query(StepsInfo).filter(StepsInfo.stage_id == stage.id).delete(synchronize_session=False)
                session.delete(stage)
            session.delete(action)
        # if os.path.exists(video_db.video_path): os.remove(video_db.video_path)
        session.delete(video_db)

    session.commit()
    return {"message": "Video deleted successfully"}


@router.delete("/action")
def delete_action(action_del_data: DeleteAction, session: SessionDep = SessionDep):
    authorize_admin(action_del_data.admin_doctor_id, session)
    action_db = session.query(Action).filter(
        Action.id == action_del_data.action_id, Action.is_deleted == False).first()
    if not action_db:
        raise HTTPException(status_code=404, detail="Action not found")

    action_db.is_deleted = True
    action_db.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    stages = session.query(Stage).filter(Stage.action_id == action_db.id, Stage.is_deleted == False).all()
    for stage in stages:
        stage.is_deleted = True
        stage.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        steps = session.query(StepsInfo).filter(StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step in steps:
            step.is_deleted = True
            step.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if action_db.parent_id == action_db.id:
        child_actions = session.query(Action).filter(Action.parent_id == action_db.id, Action.id != action_db.id, Action.is_deleted == False).all()
        for child_action in child_actions:
            child_action.is_deleted = True
            child_action.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            child_stages = session.query(Stage).filter(Stage.action_id == child_action.id, Stage.is_deleted == False).all()
            for c_stage in child_stages:
                c_stage.is_deleted = True
                c_stage.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                c_steps = session.query(StepsInfo).filter(StepsInfo.stage_id == c_stage.id, StepsInfo.is_deleted == False).all()
                for c_step in c_steps:
                    c_step.is_deleted = True
                    c_step.update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    session.commit()
    return {"message": "Action deleted successfully"}


# --- Dashboard Endpoints (Moved from apis/dashboard.py and new ones) ---
@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    doctor_count = session.query(Doctors).filter(Doctors.is_deleted == False).count()
    patient_count = session.query(Patients).filter(Patients.is_deleted == False).count()
    video_count = session.query(VideoPath).filter(VideoPath.is_deleted == False).count()
    data_analysis_count = session.query(Action).filter(Action.is_deleted == False).count()

    return DashboardMetrics(
        doctorCount=doctor_count,
        patientCount=patient_count,
        videoCount=video_count,
        dataAnalysisCount=data_analysis_count
    )

@router.get("/dashboard/analysis-trends", response_model=List[DataAnalysisDataPoint])
async def get_analysis_trends(admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    
    # Query to get count of actions grouped by month and year of creation_time
    # Assuming Action.create_time is a string in 'YYYY-MM-DD HH:MM:SS' format
    # For PostgreSQL, to_timestamp can convert string to timestamp, then to_char for formatting
    query_result = session.query(
        func.to_char(func.to_timestamp(Action.create_time, 'YYYY-MM-DD HH24:MI:SS'), 'Mon ''YY'),
        func.count(Action.id).label('analyses_count'),
        func.extract('year', func.to_timestamp(Action.create_time, 'YYYY-MM-DD HH24:MI:SS')).label('year'),
        func.extract('month', func.to_timestamp(Action.create_time, 'YYYY-MM-DD HH24:MI:SS')).label('month')
    ).filter(Action.is_deleted == False).group_by(
        func.to_char(func.to_timestamp(Action.create_time, 'YYYY-MM-DD HH24:MI:SS'), 'Mon ''YY'),
        'year', 
        'month'
    ).order_by('year', 'month').all()

    trend_data = [DataAnalysisDataPoint(date=row[0], analyses=row[1]) for row in query_result]
    return trend_data


# --- Moved Chart-specific routes from dashboard.py ---
# These routes now require admin_doctor_id and are prefixed with /dashboard under /management

toolbox_opts_dashboard = opts.global_options.ToolBoxFeatureOpts(
    save_as_image={"show": True, "title": "save as image", "type": "png"})

@router.get("/dashboard/step_hip_degree/{action_id}")
async def get_step_hip_degree_overlap_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_low_data = []
    y_high_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_low_data.append(round(step_info.hip_min_degree, 2))
            y_high_data.append(round(step_info.hip_max_degree, 2))
            step += 1

    line = Line({"theme": "light"}) # Consider if theme should be configurable or match frontend
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(
        series_name="最小值", y_axis=y_low_data, is_smooth=True,
        areastyle_opts=opts.AreaStyleOpts(opacity=0.3), stack="stack1"
    )
    line.add_yaxis(
        series_name="最大值", y_axis=y_high_data, is_smooth=True,
        areastyle_opts=opts.AreaStyleOpts(opacity=0.3), stack="stack1"
    )
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="髋关节角度范围"),
        tooltip_opts=opts.TooltipOpts(trigger="axis", axis_pointer_type="cross"),
        xaxis_opts=opts.AxisOpts(type_="category", boundary_gap=False, axislabel_opts=opts.LabelOpts(rotate=90)),
        yaxis_opts=opts.AxisOpts(type_="value", name="度", name_location="end", name_gap=15),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
    )
    return line.dump_options_with_quotes()


@router.get("/dashboard/step_hip_degree/raw/{action_id}")
async def get_step_hip_degree_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_low_data = []
    y_high_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_low_data.append(round(step_info.hip_min_degree, 2))
            y_high_data.append(round(step_info.hip_max_degree, 2))
            step += 1
    return {"x_data": x_data, "y_low_data": y_low_data, "y_high_data": y_high_data}


@router.get("/dashboard/step_width/{action_id}")
async def get_step_width_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.step_width * 100, 2)) # Assuming conversion to cm
            step += 1
    line = Line()
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(series_name="步宽", y_axis=y_data, is_smooth=True)
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="步宽"),
        xaxis_opts=opts.AxisOpts(axislabel_opts=opts.LabelOpts(rotate=90)),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
        yaxis_opts=opts.AxisOpts(name="厘米", name_location="end", name_gap=15)
    )
    return line.dump_options_with_quotes()

@router.get("/dashboard/step_width/raw/{action_id}")
async def get_step_width_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.step_width, 2)) # Raw data, assuming meters
            step += 1
    return {"x_data": x_data, "y_data": y_data}

@router.get("/dashboard/step_length/{action_id}")
async def get_step_length_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_left = []
    y_right = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            if step_info.front_leg == "left":
                y_left.append(round(step_info.step_length * 100, 2))
                y_right.append(None)
            else:
                y_left.append(None)
                y_right.append(round(step_info.step_length * 100, 2))
            step += 1
    line = Line(init_opts=opts.InitOpts(theme=ThemeType.LIGHT)) # Example: Light theme
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(series_name="左脚", y_axis=y_left, is_smooth=True, is_connect_nones=True, symbol_size=8)
    line.add_yaxis(series_name="右脚", y_axis=y_right, is_smooth=True, is_connect_nones=True, symbol_size=8)
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="步长"),
        xaxis_opts=opts.AxisOpts(axislabel_opts=opts.LabelOpts(rotate=90)),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
        yaxis_opts=opts.AxisOpts(name="厘米", name_location="end", name_gap=15)
    )
    return line.dump_options_with_quotes()

@router.get("/dashboard/step_length/raw/{action_id}")
async def get_step_length_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_left = []
    y_right = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            if step_info.front_leg == "left":
                y_left.append(round(step_info.step_length, 2))
                y_right.append(None)
            else:
                y_left.append(None)
                y_right.append(round(step_info.step_length, 2))
            step += 1
    return {"x_data": x_data, "y_left": y_left, "y_right": y_right}


@router.get("/dashboard/step_speed/{action_id}")
async def get_step_speed_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_left_data = []
    y_right_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            if step_info.front_leg == "left":
                y_left_data.append(round(step_info.step_speed * 100, 2)) # cm/s
                y_right_data.append(None)
            else:
                y_left_data.append(None)
                y_right_data.append(round(step_info.step_speed * 100, 2)) # cm/s
            step += 1
    line = Line(init_opts=opts.InitOpts(theme=ThemeType.LIGHT))
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(series_name="左脚", y_axis=y_left_data, is_smooth=True, is_connect_nones=True, symbol_size=8)
    line.add_yaxis(series_name="右脚", y_axis=y_right_data, is_smooth=True, is_connect_nones=True, symbol_size=8)
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="步速"),
        xaxis_opts=opts.AxisOpts(axislabel_opts=opts.LabelOpts(rotate=90)),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
        yaxis_opts=opts.AxisOpts(name="厘米/秒", name_location="end", name_gap=15)
    )
    return line.dump_options_with_quotes()

@router.get("/dashboard/step_speed/raw/{action_id}")
async def get_step_speed_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_left_data = []
    y_right_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            if step_info.front_leg == "left":
                y_left_data.append(round(step_info.step_speed, 2)) # m/s
                y_right_data.append(None)
            else:
                y_left_data.append(None)
                y_right_data.append(round(step_info.step_speed, 2)) # m/s
            step += 1
    return {"x_data": x_data, "y_left_data": y_left_data, "y_right_data": y_right_data}

@router.get("/dashboard/step_stride/{action_id}")
async def get_step_stride_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.stride_length * 100, 2)) # cm
            step += 1
    line = Line()
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(series_name="步幅", y_axis=y_data, is_smooth=True)
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="步幅"),
        xaxis_opts=opts.AxisOpts(axislabel_opts=opts.LabelOpts(rotate=90)),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
        yaxis_opts=opts.AxisOpts(name="厘米", name_location="end", name_gap=15)
    )
    return line.dump_options_with_quotes()

@router.get("/dashboard/step_stride/raw/{action_id}")
async def get_step_stride_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.stride_length, 2)) # meters
            step += 1
    return {"x_data": x_data, "y_data": y_data}


@router.get("/dashboard/step_difference/{action_id}")
async def get_step_difference_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step} - {step + 1}步")
            y_data.append(round(step_info.steps_diff * 100, 2)) # cm
            step += 1
    line = Line()
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(series_name="步长差", y_axis=y_data, is_smooth=True)
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="步长差"),
        xaxis_opts=opts.AxisOpts(axislabel_opts=opts.LabelOpts(rotate=90)),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
        yaxis_opts=opts.AxisOpts(name="厘米", name_location="end", name_gap=15)
    )
    return line.dump_options_with_quotes()

@router.get("/dashboard/step_difference/raw/{action_id}")
async def get_step_difference_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step} - {step + 1}步")
            y_data.append(round(step_info.steps_diff, 2)) # meters
            step += 1
    return {"x_data": x_data, "y_data": y_data}


@router.get("/dashboard/support_time/{action_id}")
async def get_support_time_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.support_time, 2)) # seconds
            step += 1
    line = Line()
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(series_name="支撑时间", y_axis=y_data, is_smooth=True)
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="支撑时间"),
        xaxis_opts=opts.AxisOpts(axislabel_opts=opts.LabelOpts(rotate=90)),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
        yaxis_opts=opts.AxisOpts(name="秒", name_location="end", name_gap=15)
    )
    return line.dump_options_with_quotes()

@router.get("/dashboard/support_time/raw/{action_id}")
async def get_support_time_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.support_time, 2)) # seconds
            step += 1
    return {"x_data": x_data, "y_data": y_data}


@router.get("/dashboard/liftoff_height/{action_id}")
async def get_liftoff_height_chart(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.liftoff_height * 100, 2)) # cm
            step += 1
    line = Line()
    line.add_xaxis(xaxis_data=x_data)
    line.add_yaxis(series_name="离地距离", y_axis=y_data, is_smooth=True)
    line.set_global_opts(
        title_opts=opts.TitleOpts(title="离地距离"),
        xaxis_opts=opts.AxisOpts(axislabel_opts=opts.LabelOpts(rotate=90)),
        toolbox_opts=opts.ToolboxOpts(feature=toolbox_opts_dashboard),
        yaxis_opts=opts.AxisOpts(name="厘米", name_location="end", name_gap=15)
    )
    return line.dump_options_with_quotes()


@router.get("/dashboard/liftoff_height/raw/{action_id}")
async def get_liftoff_height_raw_data(action_id: int, admin_doctor_id: int = Query(...), session: SessionDep = SessionDep):
    authorize_admin(admin_doctor_id, session)
    x_data = []
    y_data = []
    step = 1
    stages = session.query(Stage).filter(
        Stage.action_id == action_id, Stage.is_deleted == False).all()
    for stage in stages:
        steps_info = session.query(StepsInfo).filter(
            StepsInfo.stage_id == stage.id, StepsInfo.is_deleted == False).all()
        for step_info in steps_info:
            x_data.append(f"第{step}步")
            y_data.append(round(step_info.liftoff_height, 2)) # meters
            step += 1
    return {"x_data": x_data, "y_data": y_data}
```
  </change>
  <change>
    <file>backend/apis/dashboard.py</file>
    <description>Delete dashboard.py as its routes have been moved to management.py.</description>
    <content><![CDATA[