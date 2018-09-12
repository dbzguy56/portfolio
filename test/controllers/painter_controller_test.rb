require 'test_helper'

class GuessWhoControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get guess_who_new_url
    assert_response :success
  end

end
