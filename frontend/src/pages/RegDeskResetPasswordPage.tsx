import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * RegDeskResetPasswordPage
 * Reset links are deprecated and removed. Password recovery is handled exclusively via OTP verification.
 * Users accessing this route are automatically redirected to the OTP-based recovery flow.
 */
export const RegDeskResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/reg-desk/forgot-password', { replace: true });
  }, [navigate]);

  return null;
};
