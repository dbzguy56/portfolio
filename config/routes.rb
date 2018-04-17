Rails.application.routes.draw do

  root 'static_pages#home'
  get 'static_pages/home'
  get '/mastermind', to: 'mastermind#new'
end
