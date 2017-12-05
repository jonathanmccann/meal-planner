var modal = new tingle.modal({
  footer: true,
  stickyFooter: true,
  closeMethods: ['overlay', 'button', 'escape'],
  closeLabel: "Close"
});

modal.addFooterBtn('Close', 'close', 'delete-button tingle-btn--pull-right', function() {
  modal.close();
});

function displayContactModal(emailAddress) {
  if (emailAddress === undefined) {
    emailAddress = "";
  }

  modal.setContent(
    '<h2>Contact</h2>' +
    '<div class="success" id="success" style="display: none"></div>' +
    '<div class="error" id="error" style="display: none"></div>' +
    "Email address:" +
    '<input id="emailAddress" name="emailAddress" required="" type="text" value=' + emailAddress + '>' +
    "Message:" +
    '<textarea id="message" name="message" required="">'
  );
  
  modal.addFooterBtn('Send Message', 'send-message', 'tingle-btn--pull-right', function() {
    var success = $("#success");
    var error = $("#error");

    var data = {};
  
    data.emailAddress = $("#emailAddress").val();
    data.message = $("#message").val();

    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: 'send-message',
      success: function(data) {
        if (data.success) {
          success.html(data.success);

          error.hide();
          success.show();
        }
        if (data.error) {
          error.html(data.error);

          success.hide();
          error.show();
        }
      },
      error: function(err) {
        console.error(err);

        error.html("An unexpected error has occurred.");

        success.hide();
        error.show();
      }
    })
  });

  modal.open();
}