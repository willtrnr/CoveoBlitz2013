var showingResults = false;

//On place le search container au milieu du screen
$(document).ready(function() {
  $("#search-container").css('margin-top', $(window).height()/2 - $("#search-container").outerHeight()/2);

  $(window).resize(function() {
    if (!showingResults)
      $("#search-container").css('margin-top', $(window).height()/2 - $("#search-container").outerHeight()/2);
  });
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
      $.get('/api', requestData, function(data, textStatus, jqXHR) {
        //Move that search bar
        showingResults = true;
        $("#search-container").css('margin-top', $(window).height()/2 - $("#search-container").outerHeight()/2);

        var formattedArtists = [];

        data.results.forEach(function(doc) {
          formattedArtists.push('<div class="artist"><img src="http://ec2-23-20-62-1.compute-1.amazonaws.com:8080/BlitzDataWebService/images/' + doc.id + '" class="thumbnail"><div class="title"></div></div class="description"></div></div>');
        });

        $("#artists").html(formattedArtists.join(""));
      });
    }, 300));
});