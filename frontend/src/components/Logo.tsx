import { Link } from 'react-router-dom';

interface LogoProps {
  profileId?: number;
}

export default function Logo({ profileId }: LogoProps) {
  const linkTo = profileId ? `/profiles/${profileId}/reports` : '/profiles';

  return (
    <Link to={linkTo} className="logo" style={{ textDecoration: 'none' }}>
      <svg
        className="logo-icon"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Фон - круг с градиентом */}
        <defs>
          <linearGradient
            id="logo-bg-gradient"
            x1="0"
            y1="0"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.15)" />
            <stop offset="100%" stopColor="rgba(79, 70, 229, 0.1)" />
          </linearGradient>
          <linearGradient
            id="logo-line-gradient"
            x1="0"
            y1="0"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        
        {/* Фон - круг */}
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="url(#logo-bg-gradient)"
        />
        
        {/* График/линия тренда */}
        <path
          d="M8 32 L16 24 L22 28 L30 18 L38 12"
          stroke="url(#logo-line-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Точки на графике */}
        <circle cx="16" cy="24" r="3.5" fill="#6366f1" />
        <circle cx="22" cy="28" r="3.5" fill="#6366f1" />
        <circle cx="30" cy="18" r="3.5" fill="#6366f1" />
      </svg>
      
      <span className="logo-text">Сравнение Анализов</span>
    </Link>
  );
}
