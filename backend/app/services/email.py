import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    email_to: str,
    subject: str,
    html_content: str,
    text_content: str = None
) -> None:
    """
    Send an email.
    """
    assert settings.EMAILS_FROM_EMAIL, "EMAILS_FROM_EMAIL not set"
    
    if not text_content:
        text_content = html_content.replace('<br>', '\n').replace('</p>', '\n').replace('<p>', '')
    
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to
    
    # Add text and HTML body
    message.attach(MIMEText(text_content, "plain"))
    message.attach(MIMEText(html_content, "html"))
    
    try:
        if settings.SMTP_HOST and settings.SMTP_PORT:
            context = ssl.create_default_context()
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_TLS:
                    server.starttls(context=context)
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(
                    settings.EMAILS_FROM_EMAIL, 
                    email_to, 
                    message.as_string()
                )
            logger.info(f"Email sent to {email_to}")
        else:
            logger.warning("Email service not configured, skipping email")
    except Exception as e:
        logger.error(f"Error sending email: {e}")


def send_password_reset_email(*, email_to: str, token: str, username: str) -> None:
    """
    Send a password reset email.
    """
    reset_link = f"{settings.WEBSITE_URL}/auth/reset-password?token={token}"
    
    subject = f"{settings.APP_NAME} - Password Reset"
    
    html_content = f"""
    <p>Hi {username},</p>
    <p>You have requested to reset your password for your {settings.APP_NAME} account.</p>
    <p>Please click the link below to set a new password:</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hours.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <br>
    <p>Best regards,</p>
    <p>The {settings.APP_NAME} Team</p>
    """
    
    text_content = f"""
    Hi {username},
    
    You have requested to reset your password for your {settings.APP_NAME} account.
    
    Please click the link below to set a new password:
    {reset_link}
    
    This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hours.
    
    If you did not request a password reset, please ignore this email.
    
    Best regards,
    The {settings.APP_NAME} Team
    """
    
    send_email(
        email_to=email_to,
        subject=subject,
        html_content=html_content,
        text_content=text_content
    )
