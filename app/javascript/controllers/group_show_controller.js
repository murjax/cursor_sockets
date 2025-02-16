import { Controller } from "@hotwired/stimulus"
import consumer from "channels/consumer"

export default class extends Controller {
  static targets = [
    "chatLog",
    "chatInput",
    "receiveTemplate",
    "senderTemplate",
    "userChangeTemplate"
  ];

  connect() {
    if (document.documentElement.hasAttribute("data-turbo-preview")) { return; }

    const context = this;
    const groupId = this.data.get("group-id");

    this.name = prompt("Enter your name");
    this.sessionId = crypto.randomUUID();

    this.subscription = consumer.subscriptions.create({
      channel: "GroupChannel",
      group_id: groupId,
      session_id: this.sessionId,
      user_data: { name: this.name, session_id: this.sessionId }
    }, {
      connected() {
        document.addEventListener("mousemove", (event) => context.mouseMove(event));
      },

      disconnected() {
        document.removeEventListener("mousemove", (event) => context.mouseMove(event));
      },

      received(data) {
        switch(data.messageType) {
          case "cursor":
            context.updateCursor(data);
            break;
          case "chat":
            context.updateChat(data);
            break;
          case "userChange":
            context.updateUserChange(data);
            break;
        }
      }
    });
  }

  chatInputTargetConnected() {
    this.chatInputTarget.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const message = this.chatInputTarget.value;
        const messageId = crypto.randomUUID();
        const now = new Date();
        const sentAt = now.toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        });

        const data = { messageType: "chat", message, messageId, sentAt, sender: this.name, sessionId: this.sessionId };
        this.subscription.send(data);
        this.chatInputTarget.value = "";
      }
    });
  }

  disconnect() {
    document.removeEventListener("mousemove", this.mouseMove);
    if (this.subscription) {
      consumer.subscriptions.remove(this.subscription);
    }
  }

  mouseMove(event) {
    const x = event.clientX;
    const y = event.clientY;
    this.subscription.send({ messageType: "cursor", name: this.name, sessionId: this.sessionId, x, y });
  }

  generateVisibleColor() {
    const generateComponent = (max) => Math.floor(Math.random() * max);

    const components = Array(3).fill(0).map(() => generateComponent(200));
    const darkIndex = generateComponent(3);

    components[darkIndex] = generateComponent(100);

    const hex = components.map(c => c.toString(16).padStart(2, "0")).join("");
    return `#${hex}`;
  }

  updateCursor(data) {
    if (data.sessionId === this.sessionId) { return; }

    let cursorDiv = document.getElementById(data.sessionId);

    if (!cursorDiv) {
      cursorDiv = document.createElement("div");
      cursorDiv.id = data.sessionId;
      Object.assign(cursorDiv.style, {
        width: "8px",
        height: "8px",
        backgroundColor: this.generateVisibleColor(),
        borderRadius: "50%",
        position: "absolute"
      });
      document.body.appendChild(cursorDiv);
    }

    cursorDiv.style.left = (data.x + window.scrollX) + "px";
    cursorDiv.style.top = (data.y + window.scrollY) + "px";
  }

  updateChat(data) {
    const template = data.sessionId === this.sessionId ? this.senderTemplateTarget : this.receiveTemplateTarget;
    const messageDiv = template.cloneNode(true);
    delete messageDiv.dataset.groupShowTarget;
    messageDiv.classList.remove("hidden");
    messageDiv.classList.add("flex");
    messageDiv.querySelector(".name").innerHTML = data.sender;
    messageDiv.querySelector(".message").innerHTML = data.message;
    messageDiv.querySelector(".sent-at").innerHTML = data.sentAt;

    this.chatLogTarget.appendChild(messageDiv);
  }

  updateUserChange(data) {
    const messageDiv = this.userChangeTemplateTarget.cloneNode(true);
    delete messageDiv.dataset.groupShowTarget;
    messageDiv.classList.remove("hidden");
    messageDiv.classList.add("flex");
    messageDiv.querySelector(".user-action").innerHTML = data.action;

    this.chatLogTarget.appendChild(messageDiv);
  }
}
