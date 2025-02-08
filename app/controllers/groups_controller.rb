class GroupsController < ApplicationController
  def index
    @groups = Group.order(created_at: :desc)
  end

  def show
    @group = Group.find(params[:id])
  end

  def new
    @group = Group.new
  end

  def create
    @group = Group.new(permitted_params)

    if @group.save
      redirect_to groups_path
    else
      render :new, status: 422
    end
  end

  def edit
    @group = Group.find(params[:id])
  end

  def update
    @group = Group.find(params[:id])
    @group.assign_attributes(permitted_params)

    if @group.save
      redirect_to groups_path
    else
      render :edit, status: 422
    end
  end

  def destroy
    @group = Group.find(params[:id])
    @group.destroy
    redirect_to groups_path
  end

  private

  def permitted_params
    params.require(:group).permit(:name)
  end
end
