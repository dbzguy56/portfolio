class PostsController < ApplicationController
  before_action :logged_in_user, except: [:index]

  def index
    @posts = Post.paginate(page: params[:page], per_page: 10)
  end

  def new
    @post = current_user.posts.new
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
  end

  def destroy
  end

  private

    def post_params
      params.require(:post).permit(:title, :content)
    end
end
