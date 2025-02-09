import { Controller } from "@hotwired/stimulus"
import consumer from "channels/consumer"

export default class extends Controller {
  static targets = ["info", "chatLog", "chatInput", "messageTemplate"];

  connect() {
    if (document.documentElement.hasAttribute("data-turbo-preview")) { return; }

    const groupId = this.data.get("group-id");

    const name = prompt("Enter your name");
    this.name = name;
    const sessionId = Math.floor(Math.random() * (3000 - 30) + 30);
    this.sessionId = sessionId;

    let subscription;

    const mouseMove = (event) => {
      let x = event.clientX;
      let y = event.clientY;
      subscription.send({ messageType: "cursor", name, sessionId, x, y });
    }
    this.mouseMove = mouseMove;
    const messageTemplateTarget = this.messageTemplateTarget;
    const chatLogTarget = this.chatLogTarget;

    subscription = consumer.subscriptions.create({ channel: "GroupChannel", group_id: groupId }, {
      connected() {
        document.addEventListener("mousemove", mouseMove);
      },

      disconnected() {
        document.removeEventListener("mousemove", mouseMove);
      },

      received(data) {
        if (data.messageType == "cursor") {
          if (data.sessionId === sessionId) { return; }

          let userDiv = document.getElementById(data.sessionId);

          if (!userDiv) {
            userDiv = document.createElement("div");
            userDiv.id = data.sessionId;
            userDiv.style.width = '8px';
            userDiv.style.height = '8px';
            userDiv.style.backgroundColor = this.generateVisibleColor();
            userDiv.style.borderRadius = '50%';
            userDiv.style.position = 'absolute';
            document.body.appendChild(userDiv);
          }

          userDiv.style.left = (data.x + window.scrollX) + 'px';
          userDiv.style.top = (data.y + window.scrollY) + 'px';
        } else if (data.messageType == "chat") {
          const messageDiv = messageTemplateTarget.cloneNode(true);
          delete messageDiv.dataset.groupShowTarget;
          messageDiv.classList.remove("hidden");
          messageDiv.classList.add("flex");
          messageDiv.querySelector("div:nth-child(1)").innerHTML = data.sender;
          messageDiv.querySelector("p").innerHTML = data.message;
          messageDiv.querySelector("span").innerHTML = data.sentAt;
          chatLogTarget.appendChild(messageDiv);
        }
      }
    });

    this.subscription = subscription;
  }

  chatInputTargetConnected() {
    this.chatInputTarget.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const message = this.chatInputTarget.value;
        const messageId = Math.floor(Math.random() * (3000 - 30) + 30);
        const now = new Date();
        const sentAt = now.toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
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

  generateVisibleColor() {
    let r = Math.floor(Math.random() * 200);
    let g = Math.floor(Math.random() * 200);
    let b = Math.floor(Math.random() * 200);

    const darkComponent = Math.floor(Math.random() * 3);
    switch (darkComponent) {
      case 0:
        r = Math.floor(Math.random() * 100)
        break;
      case 1:
        g = Math.floor(Math.random() * 100);
        break;
      case 2:
        b = Math.floor(Math.random() * 100);
        break;
    }

    const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    return "#" + hex;
  }
}
