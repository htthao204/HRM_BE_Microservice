from flask_socketio import Namespace, emit
from flask import request
from services.attendance_log_service import AttendanceLogService
from services.real_time_recognition import recognition_realtime
from datetime import datetime
import base64
import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)

class RealtimeRecognitionNamespace(Namespace):
    def on_connect(self):
        logger.info(f" Client connected to realtime namespace: {self.namespace}")
        emit("connected", {
            "success": True,
            "message": "Connected to real-time recognition",
            "timestamp": datetime.now().isoformat()
        })

    def on_disconnect(self):
        logger.info(f"🔴 Client disconnected from realtime namespace: {self.namespace}")

    def on_send_frame(self, data):
        try:
            employee_id = data.get("employee_id")
            image_data = data.get("image")

            if not employee_id or not image_data:
                emit("recognition_result", {
                    "success": False,
                    "error": "Missing employee_id or image",
                    "timestamp": datetime.now().isoformat()
                })
                return

            # logger.info(f"🎥 Processing real-time frame for employee {employee_id}")

            result = recognition_realtime(image_data, employee_id)
            
            result["socket_id"] = request.sid
            
            emit("recognition_result", result)
            
            # logger.info(f"📤 Sent recognition result: {result.get('success')}")

        except Exception as e:
            logger.error(f"❌ Socket.IO recognition error: {str(e)}")
            emit("recognition_result", {
                "success": False,
                "error": f"Recognition error: {str(e)}",
                "timestamp": datetime.now().isoformat(),
                "socket_id": request.sid
            })

    def on_start_recognition(self, data):
        try:
            employee_id = data.get("employee_id")
            if not employee_id:
                emit("session_started", {
                    "success": False,
                    "error": "Missing employee_id",
                    "timestamp": datetime.now().isoformat()
                })
                return
                
            logger.info(f"🚀 Starting realtime recognition for employee {employee_id}")
            
            emit("session_started", {
                "success": True,
                "message": "Real-time recognition session started",
                "employee_id": employee_id,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"❌ Error starting recognition: {str(e)}")
            emit("session_started", {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })

    def on_stop_recognition(self, data=None):
        try:
            logger.info(f"🛑 Stopping recognition session: {request.sid}")
            
            employee_id = None
            if data and isinstance(data, dict):
                employee_id = data.get('employee_id')
                if employee_id:
                    logger.info(f"Stopping recognition for employee: {employee_id}")
            
            emit("session_stopped", {
                "success": True,
                "message": "Real-time recognition session stopped",
                "employee_id": employee_id,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"❌ Error stopping recognition: {str(e)}")
            emit("session_stopped", {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })

    def on_get_status(self, data=None):
        try:
            logger.info(f"📊 Status request from client: {request.sid}")
            
            emit("status_update", {
                "success": True,
                "status": "active",
                "connected": True,
                "namespace": self.namespace,
                "socket_id": request.sid,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"❌ Error getting status: {str(e)}")
            emit("status_update", {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })