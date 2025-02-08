class GroupChannel < ApplicationCable::Channel
  def subscribed
    stream_from "group_#{params[:group_id]}"
  end

  def receive(data)
    ActionCable.server.broadcast("group_#{params[:group_id]}", data)
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
