require 'test_helper'

class MiniRedditControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get mini_reddit_index_url
    assert_response :success
  end

end
