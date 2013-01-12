$(document).ready(function() {
	//Segmented controls
	$(".segmented-element.active").css("padding-right", "16px");

	$(".segmented-element").click(function() {
		$(this).parent().find(".segmented-element").each(function() {
			if ($(this).hasClass("active"))
			{
				$(this).removeClass("active");

				if (!$(this).hasClass("last"))
				{
					$(this).css("padding-right", "15px");
				}
			}
		});

		$(this).addClass("active");

		if (!$(this).hasClass("last"))
		{
			$(this).css("padding-right", "16px");
		}
	});

	//Selectboxes
	enableSelectBoxes();

	//Submit forms on button click
	$(".button").click(function() {
		var allValid = true;

		$(this).parent().find("input[type=text]").each(function() {
			if ($(this).val() == ""){
				$(this).addClass("error");
				allValid = false;
			}
			else
			{
				$(this).removeClass("error");
			}
		});

		if (allValid)
		{
			$(this).parent().submit();
		}
	});
});