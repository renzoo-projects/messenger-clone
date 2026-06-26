function isCloudinaryUrl(url: string): boolean {
  return url.startsWith("https://res.cloudinary.com/") && url.includes("/image/upload/")
}

export function getOptimizedUrl(url: string, width = 400): string {
  if (!isCloudinaryUrl(url)) return url

  const uploadMarker = "/image/upload/"
  const uploadIdx = url.indexOf(uploadMarker)
  if (uploadIdx === -1) return url

  const afterUpload = url.slice(uploadIdx + uploadMarker.length)
  const versionMatch = afterUpload.match(/\/v\d+\//)
  if (!versionMatch) return url

  const versionPart = versionMatch[0]
  const versionIdx = afterUpload.indexOf(versionPart)
  const publicIdAndExt = afterUpload.slice(versionIdx + versionPart.length)

  const prefix = url.slice(0, uploadIdx + uploadMarker.length)
  return `${prefix}w_${width},q_auto,f_auto/${versionPart}${publicIdAndExt}`
}

export function getFullUrl(url: string): string {
  if (!isCloudinaryUrl(url)) return url

  const uploadMarker = "/image/upload/"
  const uploadIdx = url.indexOf(uploadMarker)
  if (uploadIdx === -1) return url

  const afterUpload = url.slice(uploadIdx + uploadMarker.length)
  const versionMatch = afterUpload.match(/\/v\d+\//)
  if (!versionMatch) return url

  const versionPart = versionMatch[0]
  const versionIdx = afterUpload.indexOf(versionPart)
  const publicIdAndExt = afterUpload.slice(versionIdx + versionPart.length)

  const prefix = url.slice(0, uploadIdx + uploadMarker.length)
  return `${prefix}${versionPart}${publicIdAndExt}`
}
