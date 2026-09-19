const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateSocialLinks = (links) => {
  const allowed = {
    instagram: "instagram.com",
    twitter: ["twitter.com", "x.com"],
    reddit: "reddit.com",
    youtube: ["youtube.com", "youtu.be"],
    website: null // any valid URL
  };

  for (const key in links) {
    const value = links[key];

    // allow empty
    if (!value) continue;

    if (!isValidUrl(value)) {
      return `${key} must be a valid URL`;
    }

    if (allowed[key]) {
      const hosts = Array.isArray(allowed[key])
        ? allowed[key]
        : [allowed[key]];

      const hostname = new URL(value).hostname;

      if (!hosts.some(h => hostname.includes(h))) {
        return `${key} URL is not valid`;
      }
    }
  }

  return null; // valid
};
