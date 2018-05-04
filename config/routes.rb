Rails.application.routes.draw do

  root 'static_pages#home'

  get '/mastermind', to: 'mastermind#new'
  get '/mini_reddit', to: 'mini_reddit#index'
  get '/signup', to: 'users#new'
  post '/signup', to: 'users#create'
  get '/login', to: 'sessions#new'
  post '/login', to: 'sessions#create'
  delete '/logout', to: 'sessions#destroy'
  resources :users
  resources :account_activations, only: [:edit]
end
