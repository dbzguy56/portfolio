function handleExpandClick(el) {
  var post = el.parentElement.parentElement;
  var iframe = post.getElementsByTagName("iframe")[0];
  if (el.innerText == "\u2295") { // unexpanded
    el.innerText = "\u2297";
    iframe.hidden = false;
  } else { // expanded
    el.innerText = "\u2295";
    iframe.hidden = true;
  }
}
