import React from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { Profile, AppNotification } from '../../types';

interface ProfileModalProps {
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
}

function ProfileModal({ onSwitchProfile, onCreateProfile, onDeleteProfile }: ProfileModalProps): React.ReactElement | null {
  const { state, actions } = useAppContext();
  const { showProfileModal, currentProfile, profiles } = state;

  const setShowProfileModal = (v: boolean): void => v ? actions.showModal('showProfileModal') : actions.hideModal('showProfileModal');
  const setCurrentProfile = actions.setCurrentProfile;
  const setNotification = (v: AppNotification | null): void => v === null ? actions.clearNotification() : actions.setNotification(v);

  if (!showProfileModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div className="bg-white dark:bg-deep-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 id="profile-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">Profile Management</h3>
          <button
            onClick={() => setShowProfileModal(false)}
            className="text-gray-400 dark:text-deep-400 hover:text-gray-600 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Profiles */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-deep-300 mb-2">Current Profiles</h4>
            <div className="space-y-2">
              {Object.entries(profiles).map(([id, profile]: [string, Profile]) => (
                <div key={id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-deep-700 rounded">
                  <div>
                    <div className="text-gray-900 dark:text-white font-medium">{profile.name}</div>
                    <div className="text-xs text-gray-400 dark:text-deep-400">
                      Created: {new Date(profile.created).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentProfile === id ? (
                      <span className="text-xs bg-ocean-600 text-white px-2 py-1 rounded">Active</span>
                    ) : (
                      <button
                        onClick={() => onSwitchProfile(id)}
                        className="text-ocean-400 hover:text-ocean-300 text-sm"
                      >
                        Switch
                      </button>
                    )}
                    {id !== 'default' && (
                      <button
                        onClick={() => onDeleteProfile(id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Profile */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-deep-300 mb-2">Create New Profile</h4>
            <div className="flex gap-2">
              <input
                type="text"
                id="newProfileName"
                placeholder="Enter profile name"
                className="flex-1 bg-gray-100 dark:bg-deep-700 border border-gray-300 dark:border-deep-600 rounded px-3 py-2 text-gray-900 dark:text-white"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const name = (e.target as HTMLInputElement).value.trim();
                    if (name) {
                      onCreateProfile(name);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('newProfileName') as HTMLInputElement | null;
                  const name = input?.value.trim();
                  if (name) {
                    onCreateProfile(name);
                    if (input) input.value = '';
                  }
                }}
                className="btn-primary px-4 py-2"
              >
                Create
              </button>
            </div>
          </div>

          {/* Profile Import/Export */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-deep-300 mb-2">Import/Export Profiles</h4>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const result = await (window as any).electronAPI.loadProfileFromFile();
                    if (result.success && result.data) {
                      const profileData = result.data;
                      const profileId = `imported_${Date.now()}`;

                      const newProfile = {
                        ...profileData,
                        id: profileId,
                        created: profileData.created || new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                      };

                      actions.createProfile(profileId, newProfile);
                      setCurrentProfile(profileId);
                      const customSessionCount = profileData.customSessions ? Object.keys(profileData.customSessions).length : 0;
                      setNotification({
                        message: `Profile "${profileData.name}" imported successfully!${customSessionCount > 0 ? ` (${customSessionCount} custom session(s) included)` : ''}`,
                        type: 'success',
                        duration: 3000
                      });
                    }
                  } catch (error) {
                    setNotification({
                      message: 'Failed to import profile',
                      type: 'error',
                      duration: 3000
                    });
                  }
                }}
                className="btn-secondary flex-1"
              >
                Import Profile
              </button>
              <button
                onClick={async () => {
                  try {
                    const currentProfileData = profiles[currentProfile];
                    if (currentProfileData) {
                      const result = await (window as any).electronAPI.saveProfileAs(currentProfileData);
                      if (result.success) {
                        const customSessionCount = currentProfileData.customSessions ? Object.keys(currentProfileData.customSessions).length : 0;
                        setNotification({
                          message: `Profile "${currentProfileData.name}" exported successfully!${customSessionCount > 0 ? ` (${customSessionCount} custom session(s) included)` : ''}`,
                          type: 'success',
                          duration: 3000
                        });
                      }
                    }
                  } catch (error) {
                    setNotification({
                      message: 'Failed to export profile',
                      type: 'error',
                      duration: 3000
                    });
                  }
                }}
                className="btn-secondary flex-1"
              >
                Export Current Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
