import { Controller } from "@hotwired/stimulus"
import consumer from "channels/consumer"

export default class extends Controller {
  static targets = ["chatLog", "chatInput", "receiveTemplate", "senderTemplate"];

  connect() {
    if (document.documentElement.hasAttribute("data-turbo-preview")) { return; }

    const context = this;
    const groupId = this.data.get("group-id");

    this.name = prompt("Enter your name");
    this.sessionId = Math.floor(Math.random() * (3000 - 30) + 30);

    this.subscription = consumer.subscriptions.create({ channel: "GroupChannel", group_id: groupId }, {
      connected() {
        document.addEventListener("mousemove", (event) => context.mouseMove(event, context));
      },

      disconnected() {
        document.removeEventListener("mousemove", (event) => context.mouseMove(event, context));
      },

      received(data) {
        if (data.messageType == "cursor") {
          if (data.sessionId === context.sessionId) { return; }

          let userDiv = document.getElementById(data.sessionId);

          if (!userDiv) {
            userDiv = document.createElement("div");
            userDiv.id = data.sessionId;
            userDiv.style.width = '8px';
            userDiv.style.height = '8px';
            userDiv.style.backgroundColor = context.generateVisibleColor();
            userDiv.style.borderRadius = '50%';
            userDiv.style.position = 'absolute';
            document.body.appendChild(userDiv);
          }

          userDiv.style.left = (data.x + window.scrollX) + 'px';
          userDiv.style.top = (data.y + window.scrollY) + 'px';
        } else if (data.messageType == "chat") {
          const template = data.sessionId === context.sessionId ? context.senderTemplateTarget : context.receiveTemplateTarget;
          const messageDiv = template.cloneNode(true);
          delete messageDiv.dataset.groupShowTarget;
          messageDiv.classList.remove("hidden");
          messageDiv.classList.add("flex");
          messageDiv.querySelector("p:nth-child(1)").innerHTML = data.sender;
          messageDiv.querySelector("p:nth-child(2)").innerHTML = data.message;
          messageDiv.querySelector("span").innerHTML = data.sentAt;

          context.chatLogTarget.appendChild(messageDiv);
        }
      }
    });
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

  mouseMove(event, context) {
    context = context || this;
    let x = event.clientX;
    let y = event.clientY;
    context.subscription.send({ messageType: "cursor", name: context.name, sessionId: context.sessionId, x, y });
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
