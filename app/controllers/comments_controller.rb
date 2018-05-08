class CommentsController < ApplicationController
  before_action :logged_in_user
  before_action :correct_user, only: :destroy

  def destroy
    @post = Post.find(params[:post_id])
    @comment = @post.comments.find(params[:id])
    @comment.destroy
    flash[:success] = "Comment deleted"
    redirect_to request.referrer || mini_reddit_path
  end

  def create
    @post = Post.find(params[:post_id])
    @comment = @post.comments.new(comment_params)
    @comment.user_id = current_user.id
    if @comment.save
      flash[:success] = "Comment created!"
      redirect_to post_show_path(@post, anchor: "comment-id-#{@comment.id}")
    else
      flash[:warning] = "Your comment cannot be saved! Make sure you did not submit an empty comment."
      redirect_to post_show_path(@post)
    end
  end

  def update
  end

  private

    def comment_params
      params.require(:comment).permit(:comment, :parent_id)
    end

    # Confirms the correct user.
    def correct_user
      @user = Comment.find(params[:id]).user
      flash[:warning] = "You cannot delete another user's comment." unless current_user == @user
      redirect_to(mini_reddit_path) unless current_user == @user
    end
end
