import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminResetPasswordPage
 * Reset links are deprecated and removed. Password recovery is handled exclusively via OTP verification.
 * Users accessing this route are automatically redirected to the OTP-based recovery flow.
 */
export const AdminResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/forgot-password', { replace: true });
  }, [navigate]);

  return null;
};
