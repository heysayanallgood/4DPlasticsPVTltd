(function(){
    emailjs.init("YOUR_PUBLIC_KEY");
})();

document.getElementById("contact-form").addEventListener("submit", function(e) {
    e.preventDefault();

    emailjs.sendForm(
        "YOUR_SERVICE_ID",
        "YOUR_TEMPLATE_ID",
        this
    ).then(
        function() {
            alert("Message sent successfully!");
        },
        function() {
            alert("Failed to send message.");
        }
    );
});
