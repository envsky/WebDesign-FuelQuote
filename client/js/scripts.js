var x = document.getElementById("login");
var y = document.getElementById("register");
var z = document.getElementById("btn");

function registerForm() {
  x.style.left = "-400px"
  y.style.left = "55px"
  z.style.left = "110px"
}

function loginForm() {
  x.style.left = "55px"
  y.style.left = "450px"
  z.style.left = "0px"
}

$("#slideshow > div:gt(0)").hide();

setInterval(function() {
  $('#slideshow > div:first')
    .fadeOut(2500)
    .next()
    .fadeIn(1000)
    .end()
    .appendTo('#slideshow');
}, 10000);

$(window).scroll(function() {
  if ($(document).scrollTop() > 50) {
      $('.nav').addClass('affix');
      console.log("OK");
  } else {
      $('.nav').removeClass('affix');
  }
});
