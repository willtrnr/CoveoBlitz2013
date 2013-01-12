//On place le search container au milieu du screen
$(document).ready(function() {
  $("#search-container").css('margin-top', $(window).height()/2 - $("#search-container").outerHeight()/2);
});

//On fais la query quand le user tape une search
$("#search-bar").bind("input propertychange", function (evt) {
    if (window.event && event.type == "propertychange" && event.propertyName != "value")
        return;

    window.clearTimeout($(this).data("timeout"));
    $(this).data("timeout", setTimeout(function () {
      var requestData = {
        q: $("#search-bar").val()
      }
      //Call that AJAX
      $.get('http://ec2-23-20-29-44.compute-1.amazonaws.com:3000/api', requestData, function(data, textStatus, jqXHR) {
        //Move that search bar
        $("#search-container").animate({marginTop: 50}, 200);

        console.log("Text status:", textStatus);
        console.log("Data:", data);
      });
    }, 300));
});