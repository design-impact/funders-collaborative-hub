// Rich text editor
const quillOptions = {
  modules: {
    toolbar: [
      //[{ 'header': [2, 3, 4, 5, 6, false] }],
      ["bold", "italic" /*, 'underline', 'strike'*/],
      [/*'blockquote', 'code-block', */ "link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  },
  theme: "snow",
};

// Initialize Quill editors
const quill = new Quill("#editor", {
  ...quillOptions,
  placeholder: "Enter further details",
});

// ===========================================================================
// >>> ADDED: Make the Quill rich-text field ("Further details") required <<<
// ===========================================================================

// Returns true if the Quill editor has no real text in it.
// Quill always keeps at least a "<p><br></p>" inside, so we can't check innerHTML.
// getText() gives us the plain text; if it's only whitespace, it's empty.
function isQuillEmpty(quillInstance) {
  return quillInstance.getText().trim().length === 0;
}

// Show a red validation message directly under the editor.
function showQuillError(message) {
  const editor = document.querySelector("#editor");
  if (!editor) return;

  let errorEl = document.querySelector("#editor-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.id = "editor-error";
    errorEl.style.color = "#e75f5b"; // same red used elsewhere in this form
    errorEl.style.fontSize = "0.875rem";
    errorEl.style.marginTop = "0.5rem";
    editor.parentNode.insertBefore(errorEl, editor.nextSibling);
  }
  errorEl.textContent = message;

  // Optional: red outline on the editor itself.
  editor.style.border = "1px solid #e75f5b";
}

// Remove the validation message + red outline.
function clearQuillError() {
  const errorEl = document.querySelector("#editor-error");
  if (errorEl) errorEl.textContent = "";

  const editor = document.querySelector("#editor");
  if (editor) editor.style.border = "";
}

// As soon as the user starts typing, clear the error.
quill.on("text-change", function () {
  if (!isQuillEmpty(quill)) {
    clearQuillError();
  }
});

// ===========================================================================
// >>> END ADDED SECTION <<<
// ===========================================================================

// Script to show/hide Physical location field based on Type of location
const locationTypeInput = document.querySelector("#Location-type");
const physicalLocationInput = document.querySelector("#physical-location");

if (locationTypeInput && physicalLocationInput) {
  // Anytime location type changes
  locationTypeInput.addEventListener("change", function () {
    const locationType = locationTypeInput.value;

    // Add/remove hide-onload class based on location type
    if (locationType != "Online") {
      physicalLocationInput.classList.remove("hide-onload");
    } else {
      physicalLocationInput.classList.add("hide-onload");
    }
  });
}

// URL validation function
function validateSingleURL(inputValue) {
  // Remove leading/trailing whitespace
  const trimmedValue = inputValue.trim();

  // If empty, it's valid (unless field is required)
  if (!trimmedValue) {
    return { isValid: true, message: "" };
  }

  // Check for multiple URLs by looking for:
  // - spaces (already handled)
  // - commas
  // - more than one "http" or "https" occurrence
  // - two URLs stuck together (e.g., ...com/https...)
  if (trimmedValue.includes(" ")) {
    return { isValid: false, message: "Please enter only one URL" };
  }
  if (trimmedValue.includes(",")) {
    return { isValid: false, message: "Please enter only one URL" };
  }
  // Count occurrences of "http://" or "https://"
  const urlPattern = /(https?:\/\/)/g;
  const matches = trimmedValue.match(urlPattern);
  if (matches && matches.length > 1) {
    return { isValid: false, message: "Please enter only one URL" };
  }

  // Validate the URL format
  try {
    const urlObj = new URL(trimmedValue);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return {
        isValid: false,
        message: "Please enter a valid HTTP or HTTPS URL",
      };
    }
    return { isValid: true, message: "" };
  } catch (e) {
    return { isValid: false, message: "Please enter a valid URL" };
  }
}

// Generic function to setup URL validation for all URL fields within a form
function setupURLValidationForForm(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return;

  // Find all input fields with type="url" within the form
  const urlFields = form.querySelectorAll('input[type="url"]');

  urlFields.forEach((field) => {
    // Validate on input (real-time)
    field.addEventListener("input", function () {
      const validation = validateSingleURL(this.value);
      this.setCustomValidity(validation.message);
    });

    // Also validate on blur for better UX
    field.addEventListener("blur", function () {
      const validation = validateSingleURL(this.value);
      this.setCustomValidity(validation.message);

      // Trigger validation display if invalid
      if (!validation.isValid) {
        this.reportValidity();
      }
    });
  });

  return urlFields;
}

// Function to check all URL fields validity before form submission
function checkAllURLFieldsValidity(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return true;

  const urlFields = form.querySelectorAll('input[type="url"]');

  for (const field of urlFields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }

  return true;
}

// Send error details to webhook with origin and full response
const sendErrorDetails = (origin, errorResponse) => {
  console.log("Sending error details to webhook");
  console.log(origin, errorResponse);

  const errorHook = "ym6jrhngcvg27kgz7h77yn95w1vt459l";

  // Convert error object to serializable format
  const errorObj = {
    message: errorResponse.message || "",
    name: errorResponse.name || "",
    stack: errorResponse.stack || "",
    toString: errorResponse.toString(),
  };

  fetch(`https://hook.eu1.make.com/${errorHook}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin: origin,
      error: errorObj,
    }),
  });
};

// Script to show/hide sign up type field based on sign up type
document.addEventListener("DOMContentLoaded", function () {
  // Initialize URL validation for all URL fields in the form
  setupURLValidationForForm("#submit-event");

  // Elements
  const signUpType = document.querySelector("#signUpType"); // Adjust this selector to match your dropdown or radio button
  const emailField = document.querySelector("#emailField");
  const emailInput = document.querySelector("#Email-to-register");
  const urlField = document.querySelector("#urlField");
  const urlInput = document.querySelector("#Link-to-register");

  // Hide fields initially
  emailField.style.display = "none";
  urlField.style.display = "none";

  // Function to handle showing/hiding fields based on selection
  function handleSignUpTypeChange() {
    const selectedType = signUpType.value;

    if (selectedType === "email") {
      emailField.style.display = "block";
      emailInput.required = true;
      urlField.style.display = "none";
      urlInput.required = false;
    } else if (selectedType === "online") {
      emailField.style.display = "none";
      emailInput.required = false;
      urlField.style.display = "block";
      urlInput.required = true;
    } else {
      emailField.style.display = "none";
      urlField.style.display = "none";
      emailField.required = false;
      urlField.required = false;
    }
  }

  // for add events
  // Set the max number of characters
  let textMax = 100;
  // Write the max number of characters to the element with an id of #charcount
  const charCountElement = document.getElementById("charcount");
  if (charCountElement) {
    charCountElement.textContent = textMax;
  }

  // When someone types into the input with an id of #Short-description
  const shortDescElement = document.getElementById("Short-description");
  if (shortDescElement) {
    shortDescElement.addEventListener("keyup", function () {
      // Set a variable of textLength to the length of the input
      let textLength = shortDescElement.value.length;
      // Set a variable that is the max length of text - the current length
      let textRemaining = textMax - textLength;
      // Write the number of characters remaining to the #charcount element
      if (charCountElement) {
        charCountElement.textContent = textRemaining;
      }

      let backgroundColor = "#bde8e0"; // Default: Green

      if (textRemaining <= 0) {
        backgroundColor = "#e75f5b"; // Red when limit is exceeded
      } else if (textRemaining <= 5) {
        backgroundColor = "#f5c14a"; // Orange when 5 or fewer remaining
      }

      // Apply background color if #charbox exists
      const charBoxElement = document.getElementById("charbox");
      if (charBoxElement) {
        charBoxElement.style.backgroundColor = backgroundColor;
      }
    });
  }

  // Event listener for the sign-up type selection
  signUpType.addEventListener("change", handleSignUpTypeChange);
});

// Script to suubmit form to webhook
// Select the Webflow form
const form = document.querySelector("#submit-event");

// Add an event listener to intercept the form submission.
// >>> CHANGED: added `true` (capture phase) so this runs BEFORE Webflow's own
// submit handler, letting us fully stop Webflow when our validation fails.
form.addEventListener(
  "submit",
  async function (event) {
    // Prevent the default form submission
    event.preventDefault();
    // >>> ADDED: also stop Webflow's built-in submit handler from firing.
    // Without this, Webflow submits the form itself even when our empty-check
    // blocks it — which caused the "message flashes, then it submits anyway".
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Check all URL fields validity before proceeding
  if (!checkAllURLFieldsValidity("#submit-event")) {
    return; // Stop submission if any URL field is invalid
  }

  // =========================================================================
  // >>> ADDED: block submit if the Quill "Further details" field is empty <<<
  // =========================================================================
  if (isQuillEmpty(quill)) {
    showQuillError("Please enter further details before submitting.");
    // Bring the editor into view so the user sees the message.
    document
      .querySelector("#editor")
      .scrollIntoView({ behavior: "smooth", block: "center" });
    return; // Stop submission
  }
  // =========================================================================
  // >>> END ADDED SECTION <<<
  // =========================================================================

  // two lines added for processing rich text input
  const detailsField = document.querySelector("#Further-details");
  detailsField.value = quill.root.innerHTML;

  // Get form data
  const formData = new FormData(form);

  // Convert form data to JSON
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  // >>> CHANGED: scope the success/error lookups to THIS form's wrapper.
  // The page has several Webflow forms, so document.querySelector(".w-form-done")
  // was grabbing a DIFFERENT form's (empty) success block, so our success message
  // never showed. form.closest(".w-form") targets the event form's own messages.
  const formWrap = form.closest(".w-form");
  const successMessage = formWrap.querySelector(".w-form-done");
  const errorMessage = formWrap.querySelector(".w-form-fail");
  const hookUrl = "xy2rivaujzyfb5969p2yxhb9avghv9pt";

  // Submit form data to your webhook
  try {
    const response = await fetch(`https://hook.eu1.make.com/${hookUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // Manually trigger Webflow success message
      successMessage.style.display = "block";
      errorMessage.style.display = "none";
      // >>> ADDED: hide the form itself, like Webflow normally does on success.
      // (We stop Webflow's own handler, so we have to do this ourselves.)
      form.style.display = "none";
      // Reset the form values
      form.reset();
      // >>> ADDED: also clear the Quill editor on success <<<
      quill.setText("");
      clearQuillError();
    } else {
      sendErrorDetails("Event: if-!response.ok", response);
      // Manually trigger Webflow error message
      errorMessage.style.display = "block";
      errorMessage.innerHTML =
        "Oops! Something went wrong while submitting the form. (Error 1)";
      successMessage.style.display = "none";
    }
  } catch (error) {
    sendErrorDetails("Event: catch-error", error);
    console.error("Error submitting to webhook:", error);

    // Show the Webflow error message on fetch error
    errorMessage.style.display = "block";
    errorMessage.innerHTML =
      "Oops! Something went wrong while submitting the form. (Error 2)";
    successMessage.style.display = "none";
  }
  },
  true
);
