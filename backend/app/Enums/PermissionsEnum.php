<?php

namespace App\Enums;

/**
 * Permission Types
 *
 * Định nghĩa tất cả các quyền hạn trong hệ thống.
 * Mỗi permission tương ứng với một hoặc nhiều route API được bảo vệ.
 */
enum PermissionsEnum: string
{
    // Gate chính — bắt buộc có để đăng nhập vào trang quản trị
    case ADMIN_PANEL_ACCESS = 'admin_panel.access';

    // Dashboard
    case DASHBOARD_VIEW = 'dashboard.view';

    // Người dùng
    case USERS_VIEW   = 'users.view';
    case USERS_CREATE = 'users.create';
    case USERS_UPDATE = 'users.update';
    case USERS_DELETE = 'users.delete';

    // Vai trò
    case ROLES_VIEW   = 'roles.view';
    case ROLES_MANAGE = 'roles.manage';

    // Phân quyền
    case PERMISSIONS_VIEW   = 'permissions.view';
    case PERMISSIONS_MANAGE = 'permissions.manage';

    // Thông tin CLB
    case CLUB_INFO_VIEW   = 'club_info.view';
    case CLUB_INFO_MANAGE = 'club_info.manage';

    // Liên hệ
    case CONTACTS_VIEW   = 'contacts.view';
    case CONTACTS_MANAGE = 'contacts.manage';

    // Đơn xét tuyển
    case APPLICATIONS_VIEW   = 'applications.view';
    case APPLICATIONS_MANAGE = 'applications.manage';

    // Câu hỏi xét tuyển
    case APP_QUESTIONS_VIEW   = 'application_questions.view';
    case APP_QUESTIONS_MANAGE = 'application_questions.manage';

    // Cơ cấu học thuật
    case ACADEMIC_STRUCTURE_IMPORT = 'academic_structure.import';
    case ACADEMIC_DATA_VIEW        = 'academic_data.view';

    // Cộng đồng
    case COMMUNITY_VIEW               = 'community.view';
    case COMMUNITY_CHANNELS_MANAGE    = 'community.channels.manage';
    case COMMUNITY_POSTS_VIEW         = 'community.posts.view';
    case COMMUNITY_POSTS_MANAGE       = 'community.posts.manage';
    case COMMUNITY_BLOGS_VIEW         = 'community.blogs.view';
    case COMMUNITY_BLOGS_MANAGE       = 'community.blogs.manage';
    case COMMUNITY_COMMENTS_VIEW      = 'community.comments.view';
    case COMMUNITY_COMMENTS_MANAGE    = 'community.comments.manage';
    case COMMUNITY_TAGS_MANAGE        = 'community.tags.manage';
    case COMMUNITY_NOTIFICATIONS_SEND = 'community.notifications.send';
    case COMMUNITY_CHAT_VIEW          = 'community.chat.view';
    case COMMUNITY_CHAT_MANAGE        = 'community.chat.manage';
    case COMMUNITY_MEDIA_VIEW         = 'community.media.view';
    case COMMUNITY_SKILLS_MANAGE      = 'community.skills.manage';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
