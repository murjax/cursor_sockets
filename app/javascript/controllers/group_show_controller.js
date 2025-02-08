import { Controller } from "@hotwired/stimulus"
import consumer from "channels/consumer"

export default class extends Controller {
  connect() {
    const groupId = this.data.get("group-id");

    const name = prompt("Enter your name");
    const sessionId = Math.floor(Math.random() * (3000 - 30) + 30);

    let channel;

    const mouseMove = (event) => {
      let x = event.clientX;
      let y = event.clientY;
      channel.send({ name, sessionId, x, y });
    }
    this.mouseMove = mouseMove;

    channel = consumer.subscriptions.create({ channel: "GroupChannel", group_id: groupId }, {
      connected() {
        document.addEventListener("mousemove", mouseMove);
      },

      disconnected() {
        document.removeEventListener("mousemove", mouseMove);
      },

      received(data) {
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
      }
    });
  }

  disconnect() {
    document.removeEventListener("mousemove", this.mouseMove);
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
