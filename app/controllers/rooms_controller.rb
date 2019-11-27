class RoomsController < ApplicationController
  def create
    requestBody = JSON.parse(request.body.read)

    render json: {"roomName" => requestBody["roomName"]}.to_json
  end
end
