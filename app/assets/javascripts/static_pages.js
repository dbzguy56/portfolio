var textToBeTyped = "Hello, my name is Deepak and I am a self-taught developer :)";
var i = 0;
var typingSpeed = 80;
var collapsed = true;

function copyEmail() {
  copyEmail = document.getElementById("my-email");
  copyEmail.select();
  document.execCommand("Copy");
}

function typeWriter () {
  if (i < textToBeTyped.length) {
    document.getElementById('intro-text').innerHTML += textToBeTyped.charAt(i);
    i++;
    setTimeout(typeWriter, typingSpeed);
  }
}

function openTab(e, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = e.path[2].getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  e.currentTarget.className += " active";
}

/*
#@addBgColor = ->

  if (collapsed)
    $('.navbar').removeClass 'header-bg-clear'
    $('.navbar').addClass 'header-bg-unclear'
  else
    $('.navbar').addClass 'header-bg-clear'
    $('.navbar').removeClass 'header-bg-unclear'
  collapsed = !collapsed

headerTransparency =->
  if $(window).scrollTop() > 100
    $('.navbar').removeClass 'header-bg-clear'
    $('.navbar').addClass 'header-bg-unclear'
  else
    $('.navbar').addClass 'header-bg-clear'
    $('.navbar').removeClass 'header-bg-unclear'
*/

$(document).ready(function(){
  typeWriter();
  var defaults = document.getElementsByClassName("default-tab");
  for (var i = 0; i < defaults.length; i++) {
    defaults[i].click();
  }
});
/*
  $('.navbar').addClass 'header-bg-clear'
  $(window).on 'scroll', ->
    headerTransparency()

  $('#collapsable-btn').on 'hide.bs.collapse', (e) ->
    console.log("oo")
    return
*/
