class PostsController < ApplicationController
  before_action :logged_in_user, except: [:index]
  before_action :correct_user,   only: [:edit, :update]

  def index
    @posts = Post.paginate(page: params[:page], per_page: 10)
  end

  def new
    @post = current_user.posts.new
  end

  def show
  end

  def create
    @post = current_user.posts.new(post_params)
    if @post.save
      redirect_to mini_reddit_path
    else
      render 'new'
    end
  end

  def edit
    @post = Post.find(params[:id])
  end

  def update
    @post = Post.find(params[:id])
    if @post.update_attributes(post_params)
      flash[:success] = "Post updated"
      redirect_to mini_reddit_path
    else
      render 'edit'
    end
  end

  def destroy
  end

  private

    def post_params
      params.require(:post).permit(:title, :content)
    end

    # Confirms the correct user.
    def correct_user
      @user = Post.find(params[:id]).user
      flash[:warning] = "You cannot edit another user's post." unless current_user == @user
      redirect_to(mini_reddit_path) unless current_user == @user
    end
end
