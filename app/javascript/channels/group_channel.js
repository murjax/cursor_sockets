import consumer from "channels/consumer"

const groupInfoElement = document.getElementById("group-info");
if (groupInfoElement) {
  const groupId = groupInfoElement.dataset.groupId;
  const name = prompt("Enter your name");
  const sessionId = Math.floor(Math.random() * (3000 - 30) + 30);

  let channel;

  const mouseMove = (event) => {
    let x = event.clientX;
    let y = event.clientY;
    channel.send({name, sessionId, x, y});
  }

  channel = consumer.subscriptions.create({ channel: "GroupChannel", group_id: groupId }, {
    connected() {
      document.addEventListener("mousemove", mouseMove);
    },

    disconnected() {
      document.removeEventListener("mousemove", mouseMove);
    },

    received(data) {
      let userDiv = document.getElementById(data.sessionId);

      if (!userDiv) {
        userDiv = document.createElement("div");
        userDiv.id = data.sessionId;
        userDiv.style.width = '5px';
        userDiv.style.height = '5px';
        userDiv.style.backgroundColor = 'red';
        userDiv.style.borderRadius = '50%';
        userDiv.style.position = 'absolute';
        document.body.appendChild(userDiv);
      }

      userDiv.style.left = (data.x + window.scrollX) + 'px';
      userDiv.style.top = (data.y + window.scrollY) + 'px';
    }
  });
}
