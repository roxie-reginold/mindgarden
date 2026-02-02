import { SongRecommendation } from '../types';

// Token cache
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get Spotify access token using Client Credentials Flow
 */
export const getSpotifyAccessToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env file.');
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Set expiration to 5 minutes before actual expiry for safety
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    
    return accessToken;
  } catch (error) {
    console.error('Spotify authentication error:', error);
    throw new Error('Could not authenticate with Spotify');
  }
};

/**
 * Search for a track on Spotify
 * @param query - Search query (e.g., "artist song name" or "mood ambient")
 * @param reasoning - Optional reasoning for why this song was chosen
 */
export const searchTrack = async (
  query: string, 
  reasoning?: string
): Promise<SongRecommendation | null> => {
  try {
    const token = await getSpotifyAccessToken();
    
    // Clean up query and limit to first 100 chars for API
    const cleanQuery = encodeURIComponent(query.trim().substring(0, 100));
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${cleanQuery}&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.error(`Spotify search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Check if we got any results
    if (!data.tracks?.items?.length) {
      console.warn('No tracks found for query:', query);
      return null;
    }

    // Get the first (most relevant) track
    const track = data.tracks.items[0];
    
    return {
      trackId: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      albumArt: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url,
      previewUrl: track.preview_url || undefined,
      spotifyUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
      reasoning: reasoning
    };
  } catch (error) {
    console.error('Spotify search error:', error);
    return null;
  }
};

/**
 * Get detailed track information by Spotify track ID
 * @param trackId - Spotify track ID
 */
export const getTrackDetails = async (trackId: string): Promise<SongRecommendation | null> => {
  try {
    const token = await getSpotifyAccessToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to get track details: ${response.status}`);
      return null;
    }

    const track = await response.json();
    
    return {
      trackId: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      albumArt: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url,
      previewUrl: track.preview_url || undefined,
      spotifyUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`
    };
  } catch (error) {
    console.error('Error fetching track details:', error);
    return null;
  }
};
