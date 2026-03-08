/**
 * Set copyright year to current year (Irish/Gregorian calendar).
 * Any element with class "js-copyright-year" will have its text updated.
 */
(function () {
  var year = new Date().getFullYear();
  var elements = document.querySelectorAll('.js-copyright-year');
  for (var i = 0; i < elements.length; i++) {
    elements[i].textContent = year;
  }
})();
