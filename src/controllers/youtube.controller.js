import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export const fetchYouTubeVideos = async (req, res) => {
  try {
    const { tag, channelId, sortBy = "date", maxResults = 12 } = req.query;
    if (!tag)
      return res
        .status(400)
        .json({ error: "Missing required query parameter: tag" });

    let params = {
      part: "snippet",
      type: "video",
      q: tag,
      maxResults: Number(maxResults),
      key: YOUTUBE_API_KEY,
      order: sortBy,
      videoDuration: "short",
    };
    if (channelId) params.channelId = channelId;

    const searchUrl = "https://www.googleapis.com/youtube/v3/search";
    const searchResponse = await axios.get(searchUrl, { params });
    const videoIds = searchResponse.data.items
      .map((item) => item.id.videoId)
      .join(",");

    const detailsUrl = "https://www.googleapis.com/youtube/v3/videos";
    const detailsParams = {
      part: "snippet,statistics,contentDetails",
      id: videoIds,
      key: YOUTUBE_API_KEY,
    };

    const detailsResponse = await axios.get(detailsUrl, {
      params: detailsParams,
    });
    res.json(detailsResponse.data.items);
  } catch (error) {
    console.error("YouTube API fetch error:", error);
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
};
