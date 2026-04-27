/**
 * Reusable keyframes for MUI sx. Use in sx: { animation: `${keyframesName} 0.6s ease-out forwards` }
 */
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(24px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  slideInLeft: `
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-24px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
};

export const animationStyles = {
  fadeIn: {
    animation: 'fadeIn 0.6s ease-out forwards',
    '@keyframes fadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
  },
  slideUp: {
    animation: 'slideUp 0.6s ease-out forwards',
    '@keyframes slideUp': {
      from: { opacity: 0, transform: 'translateY(24px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
  },
  slideInRight: {
    animation: 'slideInRight 0.6s ease-out forwards',
    '@keyframes slideInRight': {
      from: { opacity: 0, transform: 'translateX(24px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
    },
  },
  slideInLeft: {
    animation: 'slideInLeft 0.6s ease-out forwards',
    '@keyframes slideInLeft': {
      from: { opacity: 0, transform: 'translateX(-24px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
    },
  },
  scaleIn: {
    animation: 'scaleIn 0.5s ease-out forwards',
    '@keyframes scaleIn': {
      from: { opacity: 0, transform: 'scale(0.96)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
  },
};
