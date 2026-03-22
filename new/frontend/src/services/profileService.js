/**
 * Profile Service
 * Handles all profile-related operations with verification
 */

import API from './api';

/**
 * Update user profile with verification
 * @param {Object} profileData - Profile data to update
 * @returns {Object} Update result with verification
 */
export const updateUserProfile = async (profileData) => {
  try {
    // Validate input
    if (!profileData.name || !profileData.phone) {
      return {
        success: false,
        message: 'Name and phone are required'
      };
    }

    // Trim whitespace
    const cleanData = {
      name: profileData.name.trim(),
      phone: profileData.phone.trim(),
      address: {
        street: (profileData.address?.street || '').trim(),
        city: (profileData.address?.city || '').trim(),
        state: (profileData.address?.state || '').trim(),
        zipCode: (profileData.address?.zipCode || '').trim(),
        country: profileData.address?.country || 'India'
      }
    };

    // Step 1: Send update to backend
    console.log('📝 Updating profile...');
    const updateResponse = await API.put('/users/profile', cleanData);

    if (!updateResponse.data.success) {
      return {
        success: false,
        message: updateResponse.data.message || 'Failed to update profile'
      };
    }

    console.log('✅ Profile updated on backend at', updateResponse.data.timestamp);

    // Step 2: Verify update was stored in database
    console.log('🔍 Verifying update in database...');
    let verificationResult = { verified: false };
    
    try {
      const verifyResponse = await API.get('/users/profile/verify');
      verificationResult = verifyResponse.data;
      
      if (verificationResult.verified) {
        console.log('✅ Database verification successful at', verificationResult.timestamp);
      } else {
        console.warn('⚠️ Database verification inconclusive');
      }
    } catch (verifyError) {
      console.warn('⚠️ Could not verify update:', verifyError.message);
      // Don't fail the update if verification fails
    }

    // Step 3: Fetch fresh data
    console.log('🔄 Fetching fresh user data...');
    const freshResponse = await API.get('/users/profile');

    if (!freshResponse.data.success) {
      return {
        success: true, // Update was successful, just refresh failed
        message: 'Profile updated but could not fetch fresh data',
        user: updateResponse.data.user,
        verified: verificationResult.verified
      };
    }

    console.log('✅ Fresh user data retrieved');

    return {
      success: true,
      message: 'Profile updated successfully',
      user: freshResponse.data.user,
      verified: verificationResult.verified,
      timestamp: freshResponse.data.timestamp
    };

  } catch (error) {
    console.error('❌ Profile update error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to update profile',
      statusCode: error.response?.status
    };
  }
};

/**
 * Get current user profile
 * @returns {Object} Current user profile
 */
export const getUserProfile = async () => {
  try {
    const response = await API.get('/users/profile');

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.message
      };
    }

    return {
      success: true,
      user: response.data.user,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Verify profile update (backend verification)
 * @returns {Object} Verification result
 */
export const verifyProfileUpdate = async () => {
  try {
    const response = await API.get('/users/profile/verify');

    return {
      success: response.data.success,
      verified: response.data.verified,
      userData: response.data.userData,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('Error verifying profile:', error);
    return {
      success: false,
      verified: false,
      message: error.message
    };
  }
};

/**
 * Update password with validation
 * @param {Object} passwordData - Current and new password
 * @returns {Object} Update result
 */
export const updateUserPassword = async (passwordData) => {
  try {
    // Validate
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      return {
        success: false,
        message: 'Current password and new password are required'
      };
    }

    if (passwordData.newPassword.length < 6) {
      return {
        success: false,
        message: 'New password must be at least 6 characters'
      };
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return {
        success: false,
        message: 'Passwords do not match'
      };
    }

    const response = await API.put('/users/password', {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });

    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

export default {
  updateUserProfile,
  getUserProfile,
  verifyProfileUpdate,
  updateUserPassword
};
