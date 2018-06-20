//https://gist.github.com/afeld/1254889
let youtubeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

let httpTest = /^https?:\/\//;

export function rewrite(url: string) : string {
  let youtubeResult = youtubeRegex.exec(url);
  if (youtubeResult != null) {
    let id = youtubeResult[1];
    return `https://www.youtube.com/embed/${id}?autoplay=1`;
  }

  if (!httpTest.test(url)) {
    url = "http://" + url;
  }
  return url;
}
