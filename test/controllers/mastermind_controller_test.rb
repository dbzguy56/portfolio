require 'test_helper'

class MastermindControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get mastermind_new_url
    assert_response :success
  end

end
