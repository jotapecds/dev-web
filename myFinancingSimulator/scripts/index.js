function validateForm() {
    let errorMessage = "";
    if ($("#itax").val() == 0 && $("#ipp").val() == 0)
        errorMessage += "<p>Taxa de juros e valor final não podem ser ambos nulos.</p>";
    if ($("#itax").val() == 0 && $("#ipv").val() == 0) 
        errorMessage += "<p>Taxa de juros e valor financiado não podem ser ambos nulos.</p>";
    if ($("#ipv").val() == 0 && $("#ipp").val() == 0)
        errorMessage += "<p>Valor financiado e valor final não podem ser ambos nulos.</p>";

    return errorMessage;
}

$("#submitButton").click(function (event) {
    let errorMessage = validateForm();

    if (errorMessage != "") {
        $("#errorMessage").html(errorMessage);
        $("#errorMessage").show();
        $("#successMessage").hide();
        event.preventDefault();
    } else {
        $("#successMessage").show();
        $("#errorMessage").hide();
    }
});

dragAndSave("#cdcfieldset"); // $("#cdcfieldset").draggable()
