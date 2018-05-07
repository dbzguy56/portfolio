@centerPage = ->
  url = document.URL.split('#')
  if url.length == 2
    document.getElementById(url[1]).scrollIntoView(true);
