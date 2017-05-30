/* http://codepen.io/Creaticode/pen/ecAmo */

$(function () {
  var Accordion = function (el) {
    // define event handler...
    el.find('.accordion-button').on('click', { el: el }, this.handleClick);
  };

  Accordion.prototype.handleClick = function (e) {
    //console.log('handleClick', $(this), e.data.el);

    var $button = $(this);
    var $content = $button.next();

    $content.slideToggle();
    $button.parent().toggleClass('open');

    // Only allow one accordion open at a time
    //var $accord = e.data.el;
    //$accord.find('.accordion-content').not($content).slideUp().parent().removeClass('open');
  };

  var accordion = new Accordion($('.accordion'));
});
