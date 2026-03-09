export interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
  label: string;
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];

  // Length checks
  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push('At least 8 characters');
  }

  if (password.length >= 12) {
    score += 15;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/\d/.test(password)) {
    score += 15;
  } else {
    feedback.push('One number');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('One special character');
  }

  // Determine color and label
  let color = 'bg-red-500';
  let label = 'Weak';

  if (score >= 75) {
    color = 'bg-green-500';
    label = 'Strong';
  } else if (score >= 50) {
    color = 'bg-yellow-500';
    label = 'Medium';
  }

  return {
    score: Math.min(score, 100),
    feedback,
    color,
    label
  };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  const strength = calculatePasswordStrength(password);
  if (strength.score < 50) {
    return { valid: false, error: 'Password is too weak. Please use a stronger password.' };
  }

  return { valid: true };
};
