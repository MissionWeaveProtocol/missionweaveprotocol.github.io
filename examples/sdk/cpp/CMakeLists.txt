cmake_minimum_required(VERSION 3.24)

project(missionweaveprotocol_website_admission LANGUAGES CXX)

if(NOT DEFINED MISSIONWEAVEPROTOCOL_SDK_ROOT)
  message(FATAL_ERROR "Set MISSIONWEAVEPROTOCOL_SDK_ROOT to the exact-pinned C++ SDK checkout")
endif()

set(MISSIONWEAVEPROTOCOL_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(MISSIONWEAVEPROTOCOL_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
add_subdirectory("${MISSIONWEAVEPROTOCOL_SDK_ROOT}"
                 "${CMAKE_BINARY_DIR}/missionweaveprotocol-sdk")

add_executable(missionweaveprotocol_website_admission admission.cpp)
target_link_libraries(missionweaveprotocol_website_admission
                      PRIVATE MissionWeaveProtocol::sdk)
target_compile_features(missionweaveprotocol_website_admission PRIVATE cxx_std_20)
