class Post < ApplicationRecord
  validates :title, presence: true, length: {minimum: 3, maximum: 150}
  validates :content, presence: true
  validates :user_id, presence: true
  default_scope -> { order(created_at: :desc)}
  belongs_to :user
  has_many :comments
end
