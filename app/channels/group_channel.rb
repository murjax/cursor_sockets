class GroupChannel < ApplicationCable::Channel
  attr_accessor :user_data

  # stream and broadcast can be done by id as in example below or with resource.
  # May consider using the id to reduce hits to the database.
  def subscribed
    self.user_data = params[:user_data]
    ActionCable.server.broadcast(
      "group_#{params[:group_id]}",
      { messageType: "userChange", action: "#{user_data['name']} has joined" }
    )
    stream_from "group_#{params[:group_id]}"
    # stream_for Group.find(params[:group_id])
  end

  def receive(data)
    ActionCable.server.broadcast("group_#{params[:group_id]}", data)
    # broadcast_to(Group.find(params[:group_id]), data)
  end

  def unsubscribed
    ActionCable.server.broadcast(
      "group_#{params[:group_id]}",
      { messageType: "userChange", action: "#{user_data['name']} has left" }
    )
  end
end
