define(function () {
  function createFragment(html) {
    var fragment = document.createDocumentFragment();
    var temp = document.createElement('div');
    var count = 1;
    var table = '<table>';
    var tableEnd = '</table>';
    var tbody = '<tbody>';
    var tbodyEnd = '</tbody>';
    var tr = '<tr>';
    var trEnd = '</tr>';

    html = html.toString();

    if ((html.indexOf('<option') != -1) && html.indexOf('<select') == -1) {
      html = '<select>' + html + '</select>';
      count = 2;
    } else if (html.indexOf('<table') == -1) {
      if (html.match(/<(tbody|thead|tfoot)/)) {
        count = 2;
        html = table + html + tableEnd;
      } else if (html.indexOf('<tr') != -1) {
        count = 3;
        html = table + tbody + html + tbodyEnd + tableEnd;
      } else if (html.match(/<(td|th)/)) {
        count = 4;
        html = table + tbody + tr + html + trEnd + tbodyEnd + tableEnd;
      }
    }


    temp.innerHTML = 'A<div>' + html + '</div>';

    while (count--) {
      temp = temp.lastChild;
    }

    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }

    return fragment;
  }

  return createFragment;
});