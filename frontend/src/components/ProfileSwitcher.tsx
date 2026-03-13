import type { Profile } from '../types';

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeProfileId: number | null;
  onProfileChange: (profileId: number) => void;
}

export default function ProfileSwitcher({
  profiles,
  activeProfileId,
  onProfileChange,
}: ProfileSwitcherProps) {
  if (profiles.length === 0) {
    return null;
  }

  return (
    <div className="profile-switcher">
      <label>Профиль:</label>
      <select
        value={activeProfileId || ''}
        onChange={e => onProfileChange(parseInt(e.target.value))}
      >
        {profiles.map(profile => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </div>
  );
}
