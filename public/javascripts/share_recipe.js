var modal = new tingle.modal({
  footer: true,
  stickyFooter: true,
  closeMethods: ['overlay', 'button', 'escape'],
  closeLabel: "Close"
});

modal.addFooterBtn('Close', 'close', 'delete-button tingle-btn--pull-right', function() {
  modal.close();
});

function displayShareRecipeModal(e) {
  modal.setContent(
    '<h2>Share Recipe - ' + e.target.title + '</h2>' +
    '<div class="success" id="success" style="display: none"></div>' +
    '<div class="error" id="error" style="display: none"></div>' +
    "Recipient's email address:" +
    '<input id="emailAddress" name="emailAddress" required="" type="text">'
  );
  
  var recipeId = e.target.id;

  modal.addFooterBtn('Share Recipe', 'share-recipe', 'tingle-btn--pull-right', function() {
    var data = {};
  
    data.recipeId = recipeId;
    data.emailAddress = $("#emailAddress").val();

    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: 'share-recipe',
      success: function(data) {
        if (data.success) {
          $("#success").html(data.success);

          $("#error").hide();
          $("#success").show();
        }
        if (data.error) {
          $("#error").html(data.error);

          $("#success").hide();
          $("#error").show();
        }
      },
      error: function(err) {
        console.error(err);

        $("#error").html("An unexpected error has occurred.");

        $("#success").hide();
        $("#error").show();
      }
    })
  });

  modal.open();
}

$(document).ready(function() {
  $(document).on('click', 'i', function (e) {
    displayShareRecipeModal(e);
  });
});